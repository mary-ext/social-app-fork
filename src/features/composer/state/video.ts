import type { Client } from '@atcute/client';
import type { Blob as AtpBlob } from '@atcute/lexicons';

import { canTranscode } from '#/lib/media/video/transcode/capabilities';
import { transcodeForUpload } from '#/lib/media/video/transcode/transcode';
import type { VideoAsset } from '#/lib/media/video/types';
import { assertVideoWithinLimit } from '#/lib/media/video/validate';

import { advanceVideoProgress } from './video-progress';
import {
	type CaptionsTrack,
	getUploadErrorMessage,
	uploadAndProcessVideo,
	type VideoUploadAction,
} from './video-upload';

export type VideoAction =
	| VideoUploadAction
	| {
			type: 'compressingToUploading';
			compressionSkipped: boolean;
			signal: AbortSignal;
	  }
	| {
			type: 'updateAltText';
			altText: string;
			signal: AbortSignal;
	  }
	| {
			type: 'updateCaptions';
			updater: (prev: CaptionsTrack[]) => CaptionsTrack[];
			signal: AbortSignal;
	  };

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

type CompressingState = {
	status: 'compressing';
	progress: number;
	abortController: AbortController;
	asset: VideoAsset;
	jobId?: undefined;
	pendingPublish?: undefined;
	altText: string;
	captions: CaptionsTrack[];
};

type UploadingState = {
	status: 'uploading';
	progress: number;
	compressionSkipped: boolean;
	abortController: AbortController;
	/** original asset; its mime type determines the published post's GIF presentation. */
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

export type VideoState = ErrorState | CompressingState | UploadingState | ProcessingState | DoneState;

// codec support and whether encoding is needed are checked by the worker.
const willCompress = (asset: VideoAsset) => canTranscode(asset.kind);

export function createVideoState(
	asset: VideoAsset,
	abortController: AbortController,
): CompressingState | UploadingState {
	if (willCompress(asset)) {
		return {
			status: 'compressing',
			progress: 0,
			abortController,
			asset,
			altText: '',
			captions: [],
		};
	}

	return {
		status: 'uploading',
		progress: 0,
		compressionSkipped: true,
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
		if (state.status === 'compressing' || state.status === 'uploading') {
			const phase =
				state.status === 'uploading' && state.compressionSkipped
					? 'uploadingWithoutCompression'
					: state.status;
			const progress = advanceVideoProgress(state.progress, phase, action.progress);
			// preserve state identity so the composer reducer can skip unchanged progress.
			if (progress === state.progress) {
				return state;
			}
			return { ...state, progress };
		}
	} else if (action.type === 'compressingToUploading') {
		if (state.status === 'compressing') {
			return {
				status: 'uploading',
				// keep progress from rewinding when compression falls back to the original asset.
				progress: advanceVideoProgress(
					state.progress,
					action.compressionSkipped ? 'uploadingWithoutCompression' : 'uploading',
					0,
				),
				compressionSkipped: action.compressionSkipped,
				abortController: state.abortController,
				asset: state.asset,
				altText: state.altText,
				captions: state.captions,
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
				altText: state.altText,
				captions: state.captions,
			};
		}
	} else if (action.type === 'updateJobStatus') {
		if (state.status === 'processing') {
			const { progress } = action.jobStatus;
			const nextProgress =
				progress !== undefined
					? advanceVideoProgress(state.progress, 'processing', progress / 100)
					: state.progress;
			if (nextProgress === state.progress) {
				return state;
			}
			return { ...state, progress: nextProgress };
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
	let payload: VideoAsset;
	try {
		const compressing = willCompress(asset);
		const compressed = compressing ? await compressAsset(asset, dispatch, signal) : undefined;

		if (compressing) {
			dispatch({ type: 'compressingToUploading', compressionSkipped: compressed === undefined, signal });
		}

		// compression may bring an oversized source under the limit.
		payload = compressed ?? asset;
		assertVideoWithinLimit(payload);
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

	await uploadAndProcessVideo({ asset: payload, dispatch, pds, pdsUrl, signal });
}

function compressAsset(
	asset: VideoAsset,
	dispatch: (action: VideoAction) => void,
	signal: AbortSignal,
): Promise<VideoAsset | undefined> {
	return transcodeForUpload({
		kind: asset.kind,
		blob: asset.blob,
		signal,
		setProgress: (p) => {
			dispatch({ type: 'updateProgress', progress: p, signal });
		},
	});
}
