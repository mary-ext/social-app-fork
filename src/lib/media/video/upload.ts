import type { AppBskyVideoDefs } from '@atcute/bluesky';
import { type Client, ClientResponseError, ok } from '@atcute/client';

import { ServerError, serviceMessage } from '#/lib/media/video/errors';
import type { VideoAsset } from '#/lib/media/video/types';
import { sleep } from '#/lib/utils/sleep';

import { m } from '#/paraglide/messages';

import { createVideoClient, mimeToExt } from './client';
import { assertCanUploadVideo, type GetToken, getServiceAuthToken } from './upload-auth';
import { planParts, resendMissingParts, uploadParts } from './upload-parts';
import { retryDelayMs, withUploadRetry } from './upload-retry';

const TOKEN_LIFETIME_S = 60 * 30;
const TOKEN_REFRESH_MARGIN_MS = 60_000;
// finishUpload retains the token while it sends the blob to the PDS.
const FINISH_TOKEN_MIN_REMAINING_MS = 10 * 60_000;
const CONTROL_ATTEMPTS = 3;
const FINISH_ATTEMPTS = 3;
const ABORT_ATTEMPTS = 3;
const ABORT_TIMEOUT_MS = 10_000;
const FINISHING_POLL_MS = 1000;

type UploadOptions = {
	video: VideoAsset;
	pds: Client;
	dispatchUrl: string;
	setProgress: (progress: number) => void;
	signal: AbortSignal;
};

/**
 * uploads a video in parts.
 *
 * @param args upload options
 * @returns the processing job to poll
 * @throws the signal's abort reason if `signal` aborts
 * @throws {UploadLimitError} if the account may not upload video right now
 * @throws {ServerError} if the upload fails
 */
export async function uploadVideo(args: UploadOptions): Promise<AppBskyVideoDefs.JobStatus> {
	try {
		return await runUpload(args);
	} catch (err) {
		if (err instanceof ClientResponseError) {
			throw new ServerError(serviceMessage(err));
		}
		throw err;
	}
}

async function runUpload({
	video,
	pds,
	dispatchUrl,
	setProgress,
	signal,
}: UploadOptions): Promise<AppBskyVideoDefs.JobStatus> {
	signal.throwIfAborted();
	await assertCanUploadVideo({ pds, dispatchUrl });

	signal.throwIfAborted();
	const getToken = createTokenProvider({ pds, dispatchUrl });
	const name = `${crypto.randomUUID()}.${mimeToExt(video.mimeType)}`;
	const session = await withUploadRetry({
		attempts: CONTROL_ATTEMPTS,
		signal,
		action: async () =>
			ok(
				createVideoClient(await getToken({ signal })).post('app.bsky.video.startUpload', {
					input: {
						sizeBytes: video.blob.size,
						mimeType: video.mimeType,
						name,
						// the service verifies these values later, but can use them for early rejection.
						width: video.width,
						height: video.height,
						durationMs: video.duration ?? undefined,
					},
					signal,
				}),
			),
	});

	const { jobId } = session;
	const parts = planParts(video.blob.size, session.partSizeBytes);
	if (parts.length !== session.partCount) {
		throw new ServerError(m['lib.video.uploadFailed']());
	}

	// cleanup must outlive the cancelled upload, so it does not use its signal.
	const releaseOnCancel = () => {
		void getToken()
			.then((token) => abortUploadWithRetry(jobId, token))
			.catch(() => {});
	};
	signal.addEventListener('abort', releaseOnCancel, { once: true });

	const transfer = { blob: video.blob, jobId, getToken, setProgress, signal };
	try {
		try {
			await uploadParts({ ...transfer, parts });
		} catch (err) {
			signal.throwIfAborted();
			return await abortAfterFailure(jobId, await getToken({ signal }), err);
		}

		return await finalizeUpload({
			jobId,
			getToken,
			signal,
			resendMissing: (receivedPartNumbers) => resendMissingParts({ ...transfer, parts, receivedPartNumbers }),
		});
	} finally {
		signal.removeEventListener('abort', releaseOnCancel);
	}
}

// #region finalization

// retries missing parts and waits for assembly that started before an error.
async function finalizeUpload({
	jobId,
	getToken,
	signal,
	resendMissing,
}: {
	jobId: string;
	getToken: GetToken;
	signal: AbortSignal;
	resendMissing: (receivedPartNumbers: number[]) => Promise<boolean>;
}): Promise<AppBskyVideoDefs.JobStatus> {
	let staleFinishes = 0;

	while (true) {
		signal.throwIfAborted();
		const token = await getToken({ minRemainingMs: FINISH_TOKEN_MIN_REMAINING_MS, signal });

		try {
			const { jobStatus } = await ok(
				createVideoClient(token).post('app.bsky.video.finishUpload', { input: { jobId }, signal }),
			);
			return jobStatus;
		} catch (finishError) {
			signal.throwIfAborted();
			const status = await getUploadStatus(jobId, token, signal);

			switch (status.state) {
				case 'completed': {
					return completedJobStatus(status);
				}
				case 'created': {
					let resent;
					try {
						resent = await resendMissing(status.receivedParts);
					} catch (err) {
						signal.throwIfAborted();
						return await abortAfterFailure(jobId, token, err);
					}
					if (resent) {
						staleFinishes = 0;
						continue;
					}
					// retry transient finish failures before releasing the slot.
					staleFinishes++;
					if (staleFinishes >= FINISH_ATTEMPTS) {
						return await abortAfterFailure(jobId, token, finishError);
					}
					await sleep(retryDelayMs(staleFinishes), signal);
					continue;
				}
				case 'finishing': {
					// a failed finish request can still start assembly.
					await sleep(FINISHING_POLL_MS, signal);
					continue;
				}
				default: {
					throw new ServerError(status.failureReason || m['lib.video.uploadFailed']());
				}
			}
		}
	}
}

async function abortAfterFailure(
	jobId: string,
	token: string,
	cause: unknown,
): Promise<AppBskyVideoDefs.JobStatus> {
	let result;
	try {
		result = await abortUploadWithRetry(jobId, token);
	} catch {
		throw cause;
	}

	switch (result.state) {
		case 'aborted': {
			throw cause;
		}
		case 'completed': {
			// an abort can race with successful finalization.
			const status = await getUploadStatus(jobId, token);
			if (status.state === 'completed') {
				return completedJobStatus(status);
			}
			break;
		}
	}
	throw new ServerError(result.failureReason || m['lib.video.uploadFailed']());
}

function completedJobStatus(status: { jobStatus?: AppBskyVideoDefs.JobStatus }): AppBskyVideoDefs.JobStatus {
	if (!status.jobStatus) {
		throw new ServerError(m['lib.video.uploadFailed']());
	}
	return status.jobStatus;
}

// #endregion

// #region video service calls

function getUploadStatus(jobId: string, token: string, signal?: AbortSignal) {
	return withUploadRetry({
		attempts: CONTROL_ATTEMPTS,
		signal,
		action: () =>
			ok(createVideoClient(token).get('app.bsky.video.getUploadStatus', { params: { jobId }, signal })),
	});
}

// a failed upload keeps its quota slot until abort or expiry.
function abortUploadWithRetry(jobId: string, token: string) {
	return withUploadRetry({
		attempts: ABORT_ATTEMPTS,
		shouldRetry: () => true,
		action: () =>
			ok(
				createVideoClient(token).post('app.bsky.video.abortUpload', {
					input: { jobId },
					signal: AbortSignal.timeout(ABORT_TIMEOUT_MS),
				}),
			),
	});
}

// #endregion

// #region support

function createTokenProvider({ pds, dispatchUrl }: { pds: Client; dispatchUrl: string }): GetToken {
	let token: string | undefined;
	let expiresAt = 0;
	let pending: Promise<string> | undefined;

	return ({ minRemainingMs = TOKEN_REFRESH_MARGIN_MS, replacing, signal } = {}) => {
		if (token !== undefined && token !== replacing && Date.now() < expiresAt - minRemainingMs) {
			return Promise.resolve(token);
		}
		// share one token request across concurrent parts.
		pending ??= (async () => {
			const exp = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_S;
			const next = await withUploadRetry({
				attempts: CONTROL_ATTEMPTS,
				signal,
				action: () => getServiceAuthToken({ pds, dispatchUrl, lxm: 'com.atproto.repo.uploadBlob', exp }),
			});
			token = next;
			expiresAt = exp * 1000;
			return next;
		})().finally(() => {
			pending = undefined;
		});
		return pending;
	};
}

// #endregion
