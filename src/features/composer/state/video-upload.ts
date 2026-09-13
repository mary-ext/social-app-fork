import type { AppBskyVideoDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Blob as AtpBlob } from '@atcute/lexicons';

import { VIDEO_MAX_SIZE_MB } from '#/lib/constants/video';
import { isNetworkError } from '#/lib/errors';
import { createVideoClient } from '#/lib/media/video/client';
import { ServerError, UploadLimitError, VideoTooLargeError } from '#/lib/media/video/errors';
import type { VideoAsset } from '#/lib/media/video/types';
import { uploadVideo } from '#/lib/media/video/upload';
import { assertVideoWithinLimit } from '#/lib/media/video/validate';
import { AbortError } from '#/lib/utils/abort-error';

import { m } from '#/paraglide/messages';

export type CaptionsTrack = { lang: string; file: File };

export type VideoUploadAction =
	| {
			type: 'uploadingToProcessing';
			jobId: string;
			signal: AbortSignal;
	  }
	| { type: 'toError'; error: string; signal: AbortSignal }
	| {
			type: 'toDone';
			blobRef: AtpBlob;
			signal: AbortSignal;
	  }
	| { type: 'updateProgress'; progress: number; signal: AbortSignal }
	| {
			type: 'updateJobStatus';
			jobStatus: AppBskyVideoDefs.JobStatus;
			signal: AbortSignal;
	  };

type UploadOptions = {
	/** upload-ready payload after transcoding or rendering */
	asset: VideoAsset;
	dispatch: (action: VideoUploadAction) => void;
	pds: Client;
	pdsUrl: string;
	signal: AbortSignal;
};

/**
 * uploads a video and waits for server processing.
 *
 * dispatches progress, completion, and errors; aborts silently.
 *
 * @param options payload, action dispatcher, PDS client and URL, and cancellation signal
 */
export async function uploadAndProcessVideo({ asset, dispatch, pds, pdsUrl, signal }: UploadOptions) {
	let uploadResponse: AppBskyVideoDefs.JobStatus | undefined;
	try {
		// oversized sources are allowed before transcoding, so check the final payload.
		assertVideoWithinLimit(asset);

		uploadResponse = await uploadVideo({
			video: asset,
			pds,
			dispatchUrl: pdsUrl,
			signal,
			setProgress: (p) => {
				dispatch({ type: 'updateProgress', progress: p, signal });
			},
		});
	} catch (e) {
		const message = getUploadErrorMessage(e);
		if (message !== null) {
			dispatch({
				type: 'toError',
				error: message,
				signal,
			});
		}
		return;
	}

	const jobId = uploadResponse.jobId;
	dispatch({
		type: 'uploadingToProcessing',
		jobId,
		signal,
	});

	// polling needs no auth; omitting it avoids token expiry during long jobs.
	const videoClient = createVideoClient();

	let pollFailures = 0;
	while (true) {
		if (signal.aborted) {
			return;
		}

		let status: AppBskyVideoDefs.JobStatus | undefined;
		let blob: AtpBlob | undefined;
		try {
			const response = await ok(videoClient.get('app.bsky.video.getJobStatus', { params: { jobId } }));
			status = response.jobStatus;
			pollFailures = 0;

			if (status.state === 'JOB_STATE_COMPLETED') {
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the video service returns a modern blob ref; legacy blobs don't occur here
				blob = status.blob as AtpBlob | undefined;
				if (!blob) {
					throw new Error('Job completed, but did not return a blob');
				}
			} else if (status.state === 'JOB_STATE_FAILED') {
				throw new Error(status.error ?? 'Job failed to process');
			}
		} catch (e) {
			if (!status) {
				pollFailures++;
				if (pollFailures < 50) {
					await new Promise((resolve) => setTimeout(resolve, 5000));
					continue;
				}
			}

			console.error('Error processing video', e);
			dispatch({
				type: 'toError',
				error: getProcessingErrorMessage(status?.failureCode, status?.error),
				signal,
			});
			return;
		}

		if (blob) {
			dispatch({
				type: 'toDone',
				blobRef: blob,
				signal,
			});
		} else {
			dispatch({
				type: 'updateJobStatus',
				jobStatus: status,
				signal,
			});
		}

		if (status.state !== 'JOB_STATE_COMPLETED' && status.state !== 'JOB_STATE_FAILED') {
			await new Promise((resolve) => setTimeout(resolve, 1500));
			continue;
		}

		return;
	}
}

function getProcessingErrorMessage(failureCode: string | undefined, error: string | undefined): string {
	switch (failureCode) {
		case 'encoding_failure': {
			return m['view.composer.video.error.processEncoding']();
		}
		case 'pds_upload_failure': {
			return m['view.composer.video.error.processHostUpload']();
		}
		case 'pds_upload_unsupported_blob_size': {
			return m['view.composer.video.error.processHostBlobSize']();
		}
		case 'validation_failure': {
			return getValidationErrorMessage(error) ?? m['view.composer.video.error.processInvalid']();
		}
		default: {
			return m['view.composer.video.error.processFailed']();
		}
	}
}

function getValidationErrorMessage(error: string | undefined): string | undefined {
	switch (error) {
		case 'bad_aspect_ratio': {
			return m['view.composer.video.error.processAspectRatio']();
		}
		case 'encoded_video_too_large': {
			return m['view.composer.video.error.processEncodedTooLarge']();
		}
		case 'unsupported_codec': {
			return m['view.composer.video.error.processCodec']();
		}
		case 'video_too_long': {
			return m['view.composer.video.error.processTooLong']();
		}
	}
}

/**
 * translates an upload or preparation error.
 *
 * @param e the thrown error
 * @returns a localized message, or null for aborts
 */
export function getUploadErrorMessage(e: unknown): string | null {
	if (e instanceof AbortError) {
		return null;
	}
	if (e instanceof VideoTooLargeError) {
		return m['view.composer.video.error.tooLarge']({ max: VIDEO_MAX_SIZE_MB });
	}
	if (e instanceof ServerError || e instanceof UploadLimitError) {
		// https://github.com/bluesky-social/tango/blob/lumi/lumi/worker/permissions.go#L77
		switch (e.message) {
			case 'User is not allowed to upload videos': {
				return m['view.composer.video.error.notAllowed']();
			}
			case 'Uploading is disabled at the moment': {
				return m['view.composer.video.error.waitlist']();
			}
			case "Failed to get user's upload stats": {
				return m['view.composer.video.error.permCheckFailed']();
			}
			case 'User has exceeded daily upload bytes limit': {
				return m['view.composer.video.error.dailyLimitBytes']();
			}
			case 'User has exceeded daily upload videos limit': {
				return m['view.composer.video.error.dailyLimitCount']();
			}
			case 'Account is not old enough to upload videos': {
				return m['view.composer.video.error.accountTooYoung']();
			}
			case 'file size (300000001 bytes) is larger than the maximum allowed size (300000000 bytes)': {
				return m['view.composer.video.error.tooLarge']({ max: VIDEO_MAX_SIZE_MB });
			}
			case 'Confirm your email address to upload videos': {
				return m['view.composer.video.error.emailConfirmRequired']();
			}
		}
	}

	if (isNetworkError(e)) {
		return m['view.composer.video.error.uploadConnection']();
	} else {
		console.error('Error uploading video', e);
	}

	const message = e instanceof Error ? e.message : '';
	return m['view.composer.video.error.upload']({ message });
}
