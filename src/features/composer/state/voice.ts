import type { Client } from '@atcute/client';
import type { Blob as AtpBlob, Did } from '@atcute/lexicons';

import { VIDEO_MAX_DURATION_MINUTES } from '#/lib/constants/video';
import { isAbortError } from '#/lib/errors';
import { getAudioDuration } from '#/lib/media/metadata';
import { canRenderVoiceClip } from '#/lib/media/video/transcode/capabilities';
import { TranscodeError } from '#/lib/media/video/transcode/errors';
import { renderVoiceClip } from '#/lib/media/video/transcode/transcode';
import type { VideoAsset } from '#/lib/media/video/types';
import { isVideoDurationAdmissible } from '#/lib/media/video/validate';

import { m } from '#/paraglide/messages';

import { advanceVideoProgress } from './video-progress';
import { type CaptionsTrack, uploadAndProcessVideo, type VideoUploadAction } from './video-upload';

export type VoiceAsset = {
	blob: Blob;
	/** duration in milliseconds, or null when the browser could not determine it */
	duration: number | null;
};

export type VoiceAssetError = 'tooLong' | 'unsupported';

/**
 * checks browser support and audio duration before attaching a voice clip.
 *
 * @param blob the audio file
 * @returns the asset, or why the file can't be used
 */
export const readVoiceAsset = async (blob: Blob): Promise<VoiceAsset | VoiceAssetError> => {
	if (!canRenderVoiceClip()) {
		return 'unsupported';
	}

	let duration: number | null;
	try {
		duration = await getAudioDuration(blob);
	} catch {
		return 'unsupported';
	}

	// the renderer checks the decoded length when the browser can't report one.
	if (duration !== null && !isVideoDurationAdmissible(duration)) {
		return 'tooLong';
	}
	return { blob, duration };
};

export type VoiceAction =
	| VideoUploadAction
	| { type: 'renderingToUploading'; rendered: VideoAsset; signal: AbortSignal }
	| { type: 'updateAltText'; altText: string; signal: AbortSignal }
	| { type: 'updateBackground'; background: string; signal: AbortSignal }
	| {
			type: 'updateCaptions';
			updater: (prev: CaptionsTrack[]) => CaptionsTrack[];
			signal: AbortSignal;
	  };

type VoiceBase = {
	abortController: AbortController;
	altText: string;
	/** CSS color derived from the avatar, or null until the avatar loads */
	background: string | null;
	asset: VoiceAsset;
	captions: CaptionsTrack[];
};

type RenderingState = VoiceBase & {
	status: 'rendering';
	progress: number;
	rendered?: undefined;
	jobId?: undefined;
	pendingPublish?: undefined;
};

type UploadingState = VoiceBase & {
	status: 'uploading';
	progress: number;
	rendered: VideoAsset;
	jobId?: undefined;
	pendingPublish?: undefined;
};

type ProcessingState = VoiceBase & {
	status: 'processing';
	progress: number;
	rendered: VideoAsset;
	jobId: string;
	pendingPublish?: undefined;
};

type DoneState = VoiceBase & {
	status: 'done';
	progress: 1;
	rendered: VideoAsset;
	jobId?: undefined;
	pendingPublish: { blobRef: AtpBlob };
};

type ErrorState = VoiceBase & {
	status: 'error';
	progress: number;
	rendered: VideoAsset | null;
	jobId: string | null;
	error: string;
	pendingPublish?: undefined;
};

export type VoiceState = RenderingState | UploadingState | ProcessingState | DoneState | ErrorState;

const baseOf = ({ abortController, altText, asset, background, captions }: VoiceState): VoiceBase => ({
	abortController,
	altText,
	asset,
	background,
	captions,
});

/**
 * initializes a voice clip for rendering.
 *
 * @param asset the selected audio
 * @param abortController controls the clip's processing
 * @returns a rendering state
 */
export function createVoiceState(asset: VoiceAsset, abortController: AbortController): VoiceState {
	return {
		status: 'rendering',
		progress: 0,
		abortController,
		altText: '',
		asset,
		background: null,
		captions: [],
	};
}

/**
 * applies a voice clip action, ignoring actions from a superseded process.
 *
 * @param state current voice clip state
 * @param action action to apply
 * @returns the next state, or `state` itself when nothing changed
 */
export function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
	if (action.signal.aborted || action.signal !== state.abortController.signal) {
		return state;
	}

	switch (action.type) {
		case 'toError': {
			return {
				...baseOf(state),
				status: 'error',
				progress: state.progress,
				rendered: state.rendered ?? null,
				jobId: state.jobId ?? null,
				error: action.error,
			};
		}
		case 'updateAltText': {
			return { ...state, altText: action.altText };
		}
		case 'updateBackground': {
			return { ...state, background: action.background };
		}
		case 'updateCaptions': {
			return { ...state, captions: action.updater(state.captions) };
		}
		case 'updateProgress': {
			if (state.status === 'rendering' || state.status === 'uploading') {
				const progress = advanceVideoProgress(state.progress, state.status, action.progress);
				if (progress === state.progress) {
					return state;
				}
				return { ...state, progress };
			}
			break;
		}
		case 'renderingToUploading': {
			if (state.status === 'rendering') {
				return {
					...baseOf(state),
					status: 'uploading',
					progress: advanceVideoProgress(state.progress, 'uploading', 0),
					rendered: action.rendered,
				};
			}
			break;
		}
		case 'uploadingToProcessing': {
			if (state.status === 'uploading') {
				return {
					...baseOf(state),
					status: 'processing',
					progress: advanceVideoProgress(state.progress, 'processing', 0),
					rendered: state.rendered,
					jobId: action.jobId,
				};
			}
			break;
		}
		case 'updateJobStatus': {
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
			break;
		}
		case 'toDone': {
			if (state.status === 'uploading' || state.status === 'processing') {
				return {
					...baseOf(state),
					status: 'done',
					progress: 1,
					rendered: state.rendered,
					pendingPublish: { blobRef: action.blobRef },
				};
			}
			break;
		}
	}

	console.error(`Unexpected voice action (${action.type}) while in ${state.status} state`);
	return state;
}

const getRenderErrorMessage = (err: unknown, asset: VoiceAsset): string => {
	switch (err instanceof TranscodeError ? err.code : 'unknown') {
		case 'audioTooLong': {
			return m['view.composer.voice.error.tooLong']({ minutes: VIDEO_MAX_DURATION_MINUTES });
		}
		case 'audioUnreadable': {
			return m['view.composer.voice.error.unsupportedType']({ mimeType: asset.blob.type });
		}
		case 'unknown': {
			return m['view.composer.voice.error.render']();
		}
	}
};

type ProcessVoiceOptions = {
	asset: VoiceAsset;
	/** the posting account, whose avatar appears in the clip */
	did: Did;
	dispatch: (action: VoiceAction) => void;
	pds: Client;
	pdsUrl: string;
	signal: AbortSignal;
};

/**
 * renders and uploads a voice clip.
 *
 * dispatches progress, completion, and errors; aborts silently.
 *
 * @param options audio, posting account, action dispatcher, PDS client and URL, and cancellation signal
 */
export async function processVoice({ asset, did, dispatch, pds, pdsUrl, signal }: ProcessVoiceOptions) {
	let rendered: VideoAsset;
	try {
		rendered = await renderVoiceClip({
			audio: asset.blob,
			did,
			label: m['view.composer.voice.cardLabel'](),
			pdsUrl,
			seed: crypto.randomUUID(),
			setBackground: (background) => {
				dispatch({ type: 'updateBackground', background, signal });
			},
			setProgress: (progress) => {
				dispatch({ type: 'updateProgress', progress, signal });
			},
			signal,
		});
	} catch (e) {
		if (isAbortError(e)) {
			return;
		}

		console.error('Failed to render voice clip', e);
		dispatch({ type: 'toError', error: getRenderErrorMessage(e, asset), signal });
		return;
	}

	dispatch({ type: 'renderingToUploading', rendered, signal });
	await uploadAndProcessVideo({ asset: rendered, dispatch, pds, pdsUrl, signal });
}
