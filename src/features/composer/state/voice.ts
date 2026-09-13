import type { Client } from '@atcute/client';
import type { Blob as AtpBlob, Did } from '@atcute/lexicons';

import { VIDEO_MAX_DURATION_MINUTES } from '#/lib/constants/video';
import { isAbortError } from '#/lib/errors';
import type { VoiceAsset } from '#/lib/media/read-attachment';
import { TranscodeError } from '#/lib/media/video/transcode/errors';
import { renderVoiceClip } from '#/lib/media/video/transcode/transcode';
import type { VideoPayload } from '#/lib/media/video/types';

import { m } from '#/paraglide/messages';

import { advanceVideoProgress } from './video-progress';
import { type CaptionsTrack, uploadAndProcessVideo, type VideoUploadAction } from './video-upload';

export type VoiceAction =
	| VideoUploadAction
	| { type: 'renderingToUploading'; payload: VideoPayload; signal: AbortSignal }
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
	payload?: undefined;
	jobId?: undefined;
	pendingPublish?: undefined;
};

type UploadingState = VoiceBase & {
	status: 'uploading';
	progress: number;
	payload: VideoPayload;
	jobId?: undefined;
	pendingPublish?: undefined;
};

type ProcessingState = VoiceBase & {
	status: 'processing';
	progress: number;
	payload: VideoPayload;
	jobId: string;
	pendingPublish?: undefined;
};

type DoneState = VoiceBase & {
	status: 'done';
	progress: 1;
	payload: VideoPayload;
	jobId?: undefined;
	pendingPublish: { blobRef: AtpBlob };
};

type ErrorState = VoiceBase & {
	status: 'error';
	progress: number;
	payload: VideoPayload | null;
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
				payload: state.payload ?? null,
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
					payload: action.payload,
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
					payload: state.payload,
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
					payload: state.payload,
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
	let payload: VideoPayload;
	try {
		payload = await renderVoiceClip({
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

	dispatch({ type: 'renderingToUploading', payload, signal });
	await uploadAndProcessVideo({ payload, dispatch, pds, pdsUrl, signal });
}
