import type { AppBskyVideoDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Blob as AtpBlob } from '@atcute/lexicons';

import { VIDEO_MAX_SIZE_MB } from '#/lib/constants/video';
import { isNetworkError } from '#/lib/errors';
import { sleep } from '#/lib/utils/sleep';

import { m } from '#/paraglide/messages';

import type { VideoPayload } from '../video-asset';
import { createVideoClient } from './service/client';
import { ServerError, UploadLimitError, VideoTooLargeError } from './service/errors';
import { uploadVideo } from './service/upload';
import { assertVideoWithinLimit } from './service/validate';
import { VideoUploadError } from './video-uploads';

const POLL_INTERVAL_MS = 1_500;
const POLL_RETRY_INTERVAL_MS = 5_000;
const MAX_POLL_FAILURES = 50;

/**
 * uploads a prepared video and waits for processing.
 *
 * @param payload the video to upload
 * @param options.pds the account's PDS client, which authorizes the upload
 * @param options.pdsUrl the account's PDS URL
 * @param options.signal cancels the upload and stops waiting
 * @param options.onUploadProgress receives the fraction of the file sent, from 0 to 1
 * @param options.onProcessing receives processing progress, from 0 to 1, starting once the upload finishes
 * @returns the processed video's blob
 * @throws {VideoUploadError} if the upload or processing fails
 * @throws the signal's abort reason if `signal` aborts
 */
export const uploadToVideoService = async (
	payload: VideoPayload,
	{
		pds,
		pdsUrl,
		signal,
		onUploadProgress,
		onProcessing,
	}: {
		pds: Client;
		pdsUrl: string;
		signal: AbortSignal;
		onUploadProgress: (sent: number) => void;
		onProcessing: (progress: number) => void;
	},
): Promise<AtpBlob> => {
	let job: AppBskyVideoDefs.JobStatus;
	try {
		// oversized sources are allowed before transcoding, so check the final payload.
		assertVideoWithinLimit(payload);
		job = await uploadVideo({
			video: payload,
			pds,
			dispatchUrl: pdsUrl,
			signal,
			setProgress: onUploadProgress,
		});
	} catch (err) {
		signal.throwIfAborted();
		throw new VideoUploadError(getUploadErrorMessage(err));
	}

	onProcessing(0);
	return waitForJob(job.jobId, { signal, onProcessing });
};

const waitForJob = async (
	jobId: string,
	{ signal, onProcessing }: { signal: AbortSignal; onProcessing: (progress: number) => void },
): Promise<AtpBlob> => {
	// polling needs no auth; omitting it avoids token expiry during long jobs.
	const client = createVideoClient();

	let failures = 0;
	while (true) {
		let status: AppBskyVideoDefs.JobStatus;
		try {
			const response = await ok(client.get('app.bsky.video.getJobStatus', { signal, params: { jobId } }));
			status = response.jobStatus;
		} catch (err) {
			signal.throwIfAborted();
			if (++failures < MAX_POLL_FAILURES) {
				await sleep(POLL_RETRY_INTERVAL_MS, signal);
				continue;
			}

			console.error('failed to poll video job', err);
			throw new VideoUploadError(m['features.composer.media.video.error.processFailed'](), jobId);
		}
		failures = 0;

		switch (status.state) {
			case 'JOB_STATE_COMPLETED': {
				if (!status.blob) {
					throw new VideoUploadError(m['features.composer.media.video.error.processFailed'](), jobId);
				}
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the video service only returns modern blob refs
				return status.blob as AtpBlob;
			}
			case 'JOB_STATE_FAILED': {
				throw new VideoUploadError(getProcessingErrorMessage(status.failureCode, status.error), jobId);
			}
		}

		if (status.progress !== undefined) {
			onProcessing(status.progress / 100);
		}
		await sleep(POLL_INTERVAL_MS, signal);
	}
};

const getProcessingErrorMessage = (failureCode: string | undefined, error: string | undefined): string => {
	switch (failureCode) {
		case 'encoding_failure': {
			return m['features.composer.media.video.error.processEncoding']();
		}
		case 'pds_upload_failure': {
			return m['features.composer.media.video.error.processHostUpload']();
		}
		case 'pds_upload_unsupported_blob_size': {
			return m['features.composer.media.video.error.processHostBlobSize']();
		}
		case 'validation_failure': {
			return getValidationErrorMessage(error) ?? m['features.composer.media.video.error.processInvalid']();
		}
		default: {
			return m['features.composer.media.video.error.processFailed']();
		}
	}
};

const getValidationErrorMessage = (error: string | undefined): string | undefined => {
	switch (error) {
		case 'bad_aspect_ratio': {
			return m['features.composer.media.video.error.processAspectRatio']();
		}
		case 'encoded_video_too_large': {
			return m['features.composer.media.video.error.processEncodedTooLarge']();
		}
		case 'unsupported_codec': {
			return m['features.composer.media.video.error.processCodec']();
		}
		case 'video_too_long': {
			return m['features.composer.media.video.error.processTooLong']();
		}
	}
};

/**
 * describes a failure to prepare or upload a video.
 *
 * @param err the thrown error, other than a cancellation
 * @returns a user-facing message
 */
export const getUploadErrorMessage = (err: unknown): string => {
	if (err instanceof VideoTooLargeError) {
		return m['features.composer.media.video.error.tooLarge']({ max: VIDEO_MAX_SIZE_MB });
	}
	if (err instanceof ServerError || err instanceof UploadLimitError) {
		// https://github.com/bluesky-social/tango/blob/lumi/lumi/worker/permissions.go#L77
		switch (err.message) {
			case 'User is not allowed to upload videos': {
				return m['features.composer.media.video.error.notAllowed']();
			}
			case 'Uploading is disabled at the moment': {
				return m['features.composer.media.video.error.waitlist']();
			}
			case "Failed to get user's upload stats": {
				return m['features.composer.media.video.error.permCheckFailed']();
			}
			case 'User has exceeded daily upload bytes limit': {
				return m['features.composer.media.video.error.dailyLimitBytes']();
			}
			case 'User has exceeded daily upload videos limit': {
				return m['features.composer.media.video.error.dailyLimitCount']();
			}
			case 'Account is not old enough to upload videos': {
				return m['features.composer.media.video.error.accountTooYoung']();
			}
			case 'file size (300000001 bytes) is larger than the maximum allowed size (300000000 bytes)': {
				return m['features.composer.media.video.error.tooLarge']({ max: VIDEO_MAX_SIZE_MB });
			}
			case 'Confirm your email address to upload videos': {
				return m['features.composer.media.video.error.emailConfirmRequired']();
			}
		}
	}

	if (isNetworkError(err)) {
		return m['features.composer.media.video.error.uploadConnection']();
	}

	console.error('failed to upload video', err);
	return m['features.composer.media.video.error.upload']({
		message: err instanceof Error ? err.message : '',
	});
};
