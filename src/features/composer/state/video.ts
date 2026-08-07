import type { AppBskyVideoDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Blob as AtpBlob } from '@atcute/lexicons';

import { uploadBlob } from '#/lib/api/records';
import { LOCAL_DEV_SERVICE } from '#/lib/constants/services';
import { VIDEO_MAX_SIZE_MB } from '#/lib/constants/video';
import { isNetworkError } from '#/lib/errors';
import { createVideoClient } from '#/lib/media/video/client';
import { ServerError, UploadLimitError, VideoTooLargeError } from '#/lib/media/video/errors';
import type { CompressedVideo, VideoAsset } from '#/lib/media/video/types';
import { uploadVideo } from '#/lib/media/video/upload';
import { assertVideoWithinLimit } from '#/lib/media/video/validate';
import { AbortError } from '#/lib/utils/abort-error';

import { m } from '#/paraglide/messages';

type CaptionsTrack = { lang: string; file: File };

export type VideoAction =
	| {
			type: 'compressingToUploading';
			video: CompressedVideo;
			signal: AbortSignal;
	  }
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
	video: undefined,
	jobId: undefined,
	pendingPublish: undefined,
	altText: '',
	captions: [],
});

export type NoVideoState = typeof NO_VIDEO;

type ErrorState = {
	status: 'error';
	progress: 100;
	abortController: AbortController;
	asset: VideoAsset | null;
	video: CompressedVideo | null;
	jobId: string | null;
	error: string;
	pendingPublish?: undefined;
	altText: string;
	captions: CaptionsTrack[];
};

type CompressingState = {
	status: 'compressing';
	progress: number;
	abortController: AbortController;
	asset: VideoAsset;
	video?: undefined;
	jobId?: undefined;
	pendingPublish?: undefined;
	altText: string;
	captions: CaptionsTrack[];
};

type UploadingState = {
	status: 'uploading';
	progress: number;
	abortController: AbortController;
	asset: VideoAsset;
	video: CompressedVideo;
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
	video: CompressedVideo;
	jobId: string;
	jobStatus: AppBskyVideoDefs.JobStatus | null;
	pendingPublish?: undefined;
	altText: string;
	captions: CaptionsTrack[];
};

type DoneState = {
	status: 'done';
	progress: 100;
	abortController: AbortController;
	asset: VideoAsset;
	video: CompressedVideo;
	jobId?: undefined;
	pendingPublish: { blobRef: AtpBlob };
	altText: string;
	captions: CaptionsTrack[];
};

export type VideoState = ErrorState | CompressingState | UploadingState | ProcessingState | DoneState;

export function createVideoState(asset: VideoAsset, abortController: AbortController): CompressingState {
	return {
		status: 'compressing',
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
			progress: 100,
			abortController: state.abortController,
			error: action.error,
			asset: state.asset ?? null,
			video: state.video ?? null,
			jobId: state.jobId ?? null,
			altText: state.altText,
			captions: state.captions,
		};
	} else if (action.type === 'updateProgress') {
		if (state.status === 'compressing' || state.status === 'uploading') {
			return {
				...state,
				progress: action.progress,
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
	} else if (action.type === 'compressingToUploading') {
		if (state.status === 'compressing') {
			return {
				status: 'uploading',
				progress: 0,
				abortController: state.abortController,
				asset: state.asset,
				video: action.video,
				altText: state.altText,
				captions: state.captions,
			};
		}
		return state;
	} else if (action.type === 'uploadingToProcessing') {
		if (state.status === 'uploading') {
			return {
				status: 'processing',
				progress: 0,
				abortController: state.abortController,
				asset: state.asset,
				video: state.video,
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
				progress: action.jobStatus.progress !== undefined ? action.jobStatus.progress / 100 : state.progress,
			};
		}
	} else if (action.type === 'toDone') {
		if (state.status === 'uploading' || state.status === 'processing') {
			return {
				status: 'done',
				progress: 100,
				abortController: state.abortController,
				asset: state.asset,
				video: state.video,
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
	did: string,
	signal: AbortSignal,
) {
	let video: CompressedVideo | undefined;
	try {
		video = assertVideoWithinLimit(asset);
	} catch (e) {
		const message = getCompressErrorMessage(e);
		if (message !== null) {
			dispatch({
				type: 'toError',
				error: message,
				signal,
			});
		}
		return;
	}
	dispatch({
		type: 'compressingToUploading',
		video,
		signal,
	});

	let uploadResponse: AppBskyVideoDefs.JobStatus | undefined;
	try {
		if (pdsUrl.startsWith(LOCAL_DEV_SERVICE)) {
			const blobRef = await uploadVideoBlobDirectly(pds, video, signal);
			dispatch({
				type: 'toDone',
				blobRef,
				signal,
			});
			return;
		}

		uploadResponse = await uploadVideo({
			video,
			pds,
			dispatchUrl: pdsUrl,
			did,
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
				error: getProcessingErrorMessage(status?.error),
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

async function uploadVideoBlobDirectly(
	pds: Client,
	video: CompressedVideo,
	signal: AbortSignal,
): Promise<AtpBlob> {
	if (signal.aborted) {
		throw new AbortError();
	}

	return uploadBlob(pds, video.blob, video.mimeType);
}

function getProcessingErrorMessage(error: string | undefined): string {
	switch (error) {
		case 'bad_aspect_ratio': {
			return m['view.composer.video.error.processAspectRatio']();
		}
		case 'unsupported_codec': {
			return m['view.composer.video.error.processCodec']();
		}
		case 'video_too_long': {
			return m['view.composer.video.error.processTooLong']();
		}
		default: {
			return m['view.composer.video.error.processFailed']();
		}
	}
}

function getCompressErrorMessage(e: unknown): string | null {
	if (e instanceof AbortError) {
		return null;
	}
	if (e instanceof VideoTooLargeError) {
		return m['view.composer.video.error.tooLarge']({ max: VIDEO_MAX_SIZE_MB });
	}
	console.error('Error compressing video', e);
	return m['view.composer.video.error.compress']();
}

function getUploadErrorMessage(e: unknown): string | null {
	if (e instanceof AbortError) {
		return null;
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
