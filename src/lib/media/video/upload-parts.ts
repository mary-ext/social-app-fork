import { ClientResponseError, isXRPCErrorPayload } from '@atcute/client';

import { AbortError, abortReason } from '#/lib/utils/abort-error';
import { clamp } from '#/lib/utils/numbers';
import { limitConcurrency } from '#/lib/utils/task';

import { createVideoEndpointUrl } from './client';
import type { GetToken } from './upload-auth';
import { isAuthUploadError, withUploadRetry } from './upload-retry';

const CONCURRENCY = 4;
const PART_ATTEMPTS = 5;
const PART_TIMEOUT_MS = 120_000;

// #region planning

/** a planned upload part. */
export type PartPlan = {
	/** 1-based part number. */
	partNumber: number;
	/** byte offset in the source blob. */
	offset: number;
	/** part size in bytes. */
	size: number;
};

/**
 * plans sequential upload parts.
 *
 * @param totalSize file size in bytes
 * @param partSize maximum part size in bytes
 * @returns parts in upload order
 * @throws {RangeError} if `partSize` is not positive
 */
export function planParts(totalSize: number, partSize: number): PartPlan[] {
	if (partSize <= 0) {
		throw new RangeError('partSize must be positive');
	}
	const parts: PartPlan[] = [];
	for (let offset = 0; offset < totalSize; offset += partSize) {
		parts.push({
			partNumber: parts.length + 1,
			offset,
			size: Math.min(partSize, totalSize - offset),
		});
	}
	return parts;
}

const sumSizes = (parts: PartPlan[]) => parts.reduce((sum, part) => sum + part.size, 0);

// #endregion

// #region transfer

type TransferOptions = {
	blob: Blob;
	jobId: string;
	getToken: GetToken;
	setProgress: (progress: number) => void;
	signal: AbortSignal;
};

/**
 * uploads parts with bounded concurrency and per-part retries.
 *
 * @param options transfer options and part plan
 * @returns when all parts are uploaded
 * @throws the signal's abort reason if `signal` aborts
 */
export async function uploadParts({
	blob,
	parts,
	jobId,
	getToken,
	setProgress,
	signal,
}: TransferOptions & { parts: PartPlan[] }): Promise<void> {
	signal.throwIfAborted();

	const totalBytes = sumSizes(parts);
	const sentByPart = new Map<number, number>();
	let sentBytes = 0;
	let lastPercent = -1;
	const reportProgress = (partNumber: number, bytesSent: number) => {
		sentBytes += bytesSent - (sentByPart.get(partNumber) ?? 0);
		sentByPart.set(partNumber, bytesSent);
		// limit updates to whole percentages to avoid excess renders.
		const percent = Math.round(clamp(sentBytes / totalBytes, 0, 1) * 100);
		if (percent !== lastPercent) {
			lastPercent = percent;
			setProgress(percent / 100);
		}
	};

	const workerController = new AbortController();
	const abortWorkers = () => workerController.abort(new AbortError());
	signal.addEventListener('abort', abortWorkers, { once: true });

	const sendOne = limitConcurrency(CONCURRENCY, async (part: PartPlan) => {
		try {
			await uploadPart({
				blob,
				part,
				jobId,
				getToken,
				onProgress: (bytesSent) => reportProgress(part.partNumber, bytesSent),
				signal: workerController.signal,
			});
		} catch (err) {
			// stop sibling uploads after the first failure.
			workerController.abort(new AbortError());
			throw err;
		}
	});

	try {
		const settled = await Promise.allSettled(parts.map(sendOne));
		signal.throwIfAborted();

		const failures = settled.filter((result) => result.status === 'rejected');
		// ignore aborts caused by a sibling's failure.
		const failure = failures.find((result) => !(result.reason instanceof AbortError)) ?? failures[0];
		if (failure) {
			throw failure.reason;
		}
	} finally {
		signal.removeEventListener('abort', abortWorkers);
	}
}

/**
 * resends parts missing during finalization.
 *
 * @param options transfer options, part plan, and received part numbers
 * @returns whether any parts were resent
 * @throws the signal's abort reason if `signal` aborts
 */
export async function resendMissingParts({
	parts,
	receivedPartNumbers,
	setProgress,
	...transfer
}: TransferOptions & { parts: PartPlan[]; receivedPartNumbers: number[] }): Promise<boolean> {
	const received = new Set(receivedPartNumbers);
	const missing = parts.filter((part) => !received.has(part.partNumber));
	if (missing.length === 0) {
		return false;
	}

	const totalBytes = sumSizes(parts);
	const missingBytes = sumSizes(missing);
	const sentBytes = totalBytes - missingBytes;
	await uploadParts({
		...transfer,
		parts: missing,
		// preserve overall progress while missing parts are resent.
		setProgress: (progress) => setProgress((sentBytes + progress * missingBytes) / totalBytes),
	});
	return true;
}

async function uploadPart({
	blob,
	part,
	jobId,
	getToken,
	onProgress,
	signal,
}: {
	blob: Blob;
	part: PartPlan;
	jobId: string;
	getToken: GetToken;
	onProgress: (bytesSent: number) => void;
	signal: AbortSignal;
}): Promise<void> {
	await withUploadRetry({
		attempts: PART_ATTEMPTS,
		signal,
		// refresh a rejected token once before normal retries.
		action: async () => {
			const token = await getToken({ signal });
			try {
				await sendPart({ blob, part, jobId, token, onProgress, signal });
			} catch (err) {
				if (!isAuthUploadError(err)) {
					throw err;
				}
				onProgress(0);
				await sendPart({
					blob,
					part,
					jobId,
					token: await getToken({ replacing: token, signal }),
					onProgress,
					signal,
				});
			}
		},
		// reset progress before a resend.
		onRetry: () => onProgress(0),
	});
}

// XHR provides upload progress in every supported browser.
function sendPart({
	blob,
	part,
	jobId,
	token,
	onProgress,
	signal,
}: {
	blob: Blob;
	part: PartPlan;
	jobId: string;
	token: string;
	onProgress: (bytesSent: number) => void;
	signal: AbortSignal;
}): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(abortReason(signal));
			return;
		}

		const xhr = new XMLHttpRequest();
		xhr.timeout = PART_TIMEOUT_MS;

		const onAbort = () => xhr.abort();
		signal.addEventListener('abort', onAbort, { once: true });
		const settle = (run: () => void) => {
			signal.removeEventListener('abort', onAbort);
			run();
		};

		xhr.upload.addEventListener('progress', (event) => {
			onProgress(event.loaded);
		});
		xhr.addEventListener(
			'load',
			() => {
				settle(() => {
					if (xhr.status >= 200 && xhr.status < 300) {
						// cover a missing final progress event.
						onProgress(part.size);
						resolve();
					} else {
						reject(responseError(xhr));
					}
				});
			},
			{ once: true },
		);
		// keep these messages compatible with NETWORK_ERRORS.
		xhr.addEventListener('error', () => settle(() => reject(new TypeError('Network request failed'))), {
			once: true,
		});
		xhr.addEventListener(
			'timeout',
			() => settle(() => reject(new TypeError('Network request failed (timed out)'))),
			{ once: true },
		);
		xhr.addEventListener('abort', () => settle(() => reject(abortReason(signal))), { once: true });

		xhr.open(
			'POST',
			createVideoEndpointUrl('/xrpc/app.bsky.video.uploadPart', {
				jobId,
				partNumber: String(part.partNumber),
			}),
		);
		xhr.setRequestHeader('Content-Type', 'application/octet-stream');
		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
		xhr.send(blob.slice(part.offset, part.offset + part.size));
	});
}

// match errors from the typed client.
function responseError(xhr: XMLHttpRequest): ClientResponseError {
	let payload;
	try {
		const parsed: unknown = JSON.parse(xhr.responseText);
		if (isXRPCErrorPayload(parsed)) {
			payload = parsed;
		}
	} catch {}
	return new ClientResponseError({
		status: xhr.status,
		data: payload ?? {
			error: 'UnknownXRPCError',
			message: `Request failed with status code ${xhr.status}`,
		},
	});
}

// #endregion
