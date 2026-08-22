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

import { advanceVideoProgress } from './video-progress';

type CaptionsTrack = { lang: string; file: File };

export type VideoAction =
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
			type: 'updateAltText';
			altText: string;
			signal: AbortSignal;
	  }
	| {
			type: 'updateCaptions';
			updater: (prev: CaptionsTrack[]) => CaptionsTrack[];
			signal: AbortSignal;
	  }
	| {
			type: 'updateJobStatus';
			jobStatus: AppBskyVideoDefs.JobStatus;
			signal: AbortSignal;
	  };

const noopController = new AbortController();
noopController.abort();

export const NO_VIDEO = Object.freeze({
	status: 'idle',
	progress: 0,
	abortController: noopController,
	asset: undefined,
	jobId: undefined,
	pendingPublish: undefined,
	altText: '',
	captions: [],
});

export type NoVideoState = typeof NO_VIDEO;

type ErrorState = {
	status: 'error';
	progress: number;
	abortController: AbortController;
	asset: VideoAsset | null;
	jobId: string | null;
	error: string;
	pendingPublish?: undefined;
	altText: string;
	captions: CaptionsTrack[];
};

type UploadingState = {
	status: 'uploading';
	progress: number;
	abortController: AbortController;
	asset: VideoAsset;
	jobId?: undefined;
	pendingPublish?: undefined;
	altText: string;
	captions: CaptionsTrack[];
};

type ProcessingState = {
	status: 'processing';
	progress: number;
	abortController: AbortController;
	asset: VideoAsset;
	jobId: string;
	jobStatus: AppBskyVideoDefs.JobStatus | null;
	pendingPublish?: undefined;
	altText: string;
	captions: CaptionsTrack[];
};

type DoneState = {
	status: 'done';
	progress: 1;
	abortController: AbortController;
	asset: VideoAsset;
	jobId?: undefined;
	pendingPublish: { blobRef: AtpBlob };
	altText: string;
	captions: CaptionsTrack[];
};

export type VideoState = ErrorState | UploadingState | ProcessingState | DoneState;

export function createVideoState(asset: VideoAsset, abortController: AbortController): UploadingState {
	return {
		status: 'uploading',
		progress: 0,
		abortController,
		asset,
		altText: '',
		captions: [],
	};
}

export function videoReducer(state: VideoState, action: VideoAction): VideoState {
	if (action.signal.aborted || action.signal !== state.abortController.signal) {
		// This action is stale and the process that spawned it is no longer relevant.
		return state;
	}
	if (action.type === 'toError') {
		return {
			status: 'error',
			progress: state.progress,
			abortController: state.abortController,
			error: action.error,
			asset: state.asset ?? null,
			jobId: state.jobId ?? null,
			altText: state.altText,
			captions: state.captions,
		};
	} else if (action.type === 'updateProgress') {
		if (state.status === 'uploading') {
			return {
				...state,
				progress: advanceVideoProgress(state.progress, 'uploading', action.progress),
			};
		}
	} else if (action.type === 'updateAltText') {
		return {
			...state,
			altText: action.altText,
		};
	} else if (action.type === 'updateCaptions') {
		return {
			...state,
			captions: action.updater(state.captions),
		};
	} else if (action.type === 'uploadingToProcessing') {
		if (state.status === 'uploading') {
			return {
				status: 'processing',
				progress: advanceVideoProgress(state.progress, 'processing', 0),
				abortController: state.abortController,
				asset: state.asset,
				jobId: action.jobId,
				jobStatus: null,
				altText: state.altText,
				captions: state.captions,
			};
		}
	} else if (action.type === 'updateJobStatus') {
		if (state.status === 'processing') {
			return {
				...state,
				jobStatus: action.jobStatus,
				progress:
					action.jobStatus.progress !== undefined
						? advanceVideoProgress(state.progress, 'processing', action.jobStatus.progress / 100)
						: state.progress,
			};
		}
	} else if (action.type === 'toDone') {
		if (state.status === 'uploading' || state.status === 'processing') {
			return {
				status: 'done',
				progress: 1,
				abortController: state.abortController,
				asset: state.asset,
				pendingPublish: {
					blobRef: action.blobRef,
				},
				altText: state.altText,
				captions: state.captions,
			};
		}
	}
	console.error('Unexpected video action (' + action.type + ') while in ' + state.status + ' state');
	return state;
}

export async function processVideo(
	asset: VideoAsset,
	dispatch: (action: VideoAction) => void,
	pdsUrl: string,
	pds: Client,
	signal: AbortSignal,
) {
	let uploadResponse: AppBskyVideoDefs.JobStatus | undefined;
	try {
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

	// Job-status polling runs unauthenticated — the service does not require auth here,
	// which also avoids a minted token expiring mid-poll on a long upload.
	const videoClient = createVideoClient();

	let pollFailures = 0;
	while (true) {
		if (signal.aborted) {
			return; // Exit async loop
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
					continue; // Continue async loop
				}
			}

			console.error('Error processing video', e);
			dispatch({
				type: 'toError',
				error: getProcessingErrorMessage(status?.failureCode, status?.error),
				signal,
			});
			return; // Exit async loop
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
			continue; // Continue async loop
		}

		return; // Exit async loop
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

function getUploadErrorMessage(e: unknown): string | null {
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
		// only report errors that are unknown (and not network errors)
		console.error('Error uploading video', e);
	}

	const message = e instanceof Error ? e.message : '';
	return m['view.composer.video.error.upload']({ message });
}
