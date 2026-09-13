import type { Client } from '@atcute/client';
import type { Blob as AtpBlob, Did } from '@atcute/lexicons';

import { VIDEO_MAX_DURATION_MINUTES } from '#/lib/constants/video';
import { isAbortError } from '#/lib/errors';
import type { Attachment, VideoAttachmentKind } from '#/lib/media/read-attachment';
import { canTranscode } from '#/lib/media/transcode/capabilities';
import { TranscodeError } from '#/lib/media/transcode/errors';
import { renderVoiceClip, transcodeForUpload } from '#/lib/media/transcode/transcode';
import { toVideoPayload, type VideoAsset, type VideoPayload, type VoiceAsset } from '#/lib/media/video/types';

import { m } from '#/paraglide/messages';

import { advanceVideoProgress } from './video-progress';
import {
	type CaptionsTrack,
	getUploadErrorMessage,
	uploadAndProcessVideo,
	type VideoUploadAction,
} from './video-upload';

/** a validated file that publishes as a video embed. */
export type VideoAttachment = Exclude<Attachment, { type: 'image' }>;

/** original media and preview state, retained after encoding. */
type VideoSource =
	| { type: 'video'; asset: VideoAsset }
	| {
			type: 'voice';
			asset: VoiceAsset;
			/** CSS color derived from the avatar, or null until the avatar loads */
			background: string | null;
	  };

export type VideoAction =
	| VideoUploadAction
	| {
			type: 'preparingToUploading';
			payload: VideoPayload;
			/** true when uploading the original file */
			preparationSkipped: boolean;
			signal: AbortSignal;
	  }
	| { type: 'updateAltText'; altText: string; signal: AbortSignal }
	| { type: 'updateBackground'; background: string; signal: AbortSignal }
	| {
			type: 'updateCaptions';
			updater: (prev: CaptionsTrack[]) => CaptionsTrack[];
			signal: AbortSignal;
	  };

type VideoBase = {
	abortController: AbortController;
	altText: string;
	captions: CaptionsTrack[];
	source: VideoSource;
};

// retain dimensions without keeping the transcoded blob in state.
type PayloadDimensions = Pick<VideoPayload, 'height' | 'width'>;

const getPayloadDimensions = ({ height, width }: VideoPayload): PayloadDimensions => ({ height, width });

/** transcoding a video or GIF, or rendering a voice clip */
type PreparingState = VideoBase & {
	status: 'preparing';
	progress: number;
	dimensions?: undefined;
	jobId?: undefined;
	pendingPublish?: undefined;
};

type UploadingState = VideoBase & {
	status: 'uploading';
	progress: number;
	/** true when uploading the original file */
	preparationSkipped: boolean;
	dimensions: PayloadDimensions;
	jobId?: undefined;
	pendingPublish?: undefined;
};

type ProcessingState = VideoBase & {
	status: 'processing';
	progress: number;
	dimensions: PayloadDimensions;
	jobId: string;
	pendingPublish?: undefined;
};

type DoneState = VideoBase & {
	status: 'done';
	progress: 1;
	dimensions: PayloadDimensions;
	jobId?: undefined;
	pendingPublish: { blobRef: AtpBlob };
};

type ErrorState = VideoBase & {
	status: 'error';
	progress: number;
	dimensions: PayloadDimensions | null;
	jobId: string | null;
	error: string;
	pendingPublish?: undefined;
};

export type VideoState = PreparingState | UploadingState | ProcessingState | DoneState | ErrorState;

/**
 * identifies the source media, including GIFs stored as video attachments.
 *
 * @param source the attachment or its retained source
 * @returns `gif` for animated GIFs, `voice` for voice clips, `video` otherwise
 */
export const getVideoSourceKind = (source: VideoAttachment): VideoAttachmentKind => {
	switch (source.type) {
		case 'video': {
			return source.asset.kind;
		}
		case 'voice': {
			return 'voice';
		}
	}
};

const baseOf = ({ abortController, altText, captions, source }: VideoState): VideoBase => ({
	abortController,
	altText,
	captions,
	source,
});

const toSource = (attachment: VideoAttachment): VideoSource => {
	switch (attachment.type) {
		case 'video': {
			return attachment;
		}
		case 'voice': {
			return { ...attachment, background: null };
		}
	}
};

/**
 * initializes preparation, or direct upload when transcoding APIs are unavailable.
 *
 * @param attachment the selected file
 * @param abortController controls the attachment's processing
 * @returns a preparing or uploading state
 */
export function createVideoState(attachment: VideoAttachment, abortController: AbortController): VideoState {
	const base: VideoBase = { abortController, altText: '', captions: [], source: toSource(attachment) };

	if (attachment.type === 'video' && !canTranscode(attachment.asset.kind)) {
		return {
			...base,
			status: 'uploading',
			progress: 0,
			preparationSkipped: true,
			dimensions: getPayloadDimensions(toVideoPayload(attachment.asset)),
		};
	}

	return { ...base, status: 'preparing', progress: 0 };
}

/**
 * applies a video action, ignoring aborted or superseded processing.
 *
 * @param state current attachment state
 * @param action action to apply
 * @returns the next state, or `state` itself when nothing changed
 */
export function videoReducer(state: VideoState, action: VideoAction): VideoState {
	if (action.signal.aborted || action.signal !== state.abortController.signal) {
		return state;
	}

	switch (action.type) {
		case 'toError': {
			return {
				...baseOf(state),
				status: 'error',
				progress: state.progress,
				dimensions: state.dimensions ?? null,
				jobId: state.jobId ?? null,
				error: action.error,
			};
		}
		case 'updateAltText': {
			return { ...state, altText: action.altText };
		}
		case 'updateBackground': {
			if (state.source.type === 'voice') {
				return { ...state, source: { ...state.source, background: action.background } };
			}
			break;
		}
		case 'updateCaptions': {
			return { ...state, captions: action.updater(state.captions) };
		}
		case 'updateProgress': {
			let progress = state.progress;
			switch (state.status) {
				case 'preparing': {
					progress = advanceVideoProgress(state.progress, 'preparing', action.progress);
					break;
				}
				case 'uploading': {
					const phase = state.preparationSkipped ? 'uploadingWithoutPreparation' : 'uploading';
					progress = advanceVideoProgress(state.progress, phase, action.progress);
					break;
				}
				default: {
					console.error(`Unexpected video action (${action.type}) while in ${state.status} state`);
					return state;
				}
			}
			// preserve state identity so the composer reducer can skip unchanged progress.
			if (progress === state.progress) {
				return state;
			}
			return { ...state, progress };
		}
		case 'preparingToUploading': {
			if (state.status === 'preparing') {
				const phase = action.preparationSkipped ? 'uploadingWithoutPreparation' : 'uploading';
				return {
					...baseOf(state),
					status: 'uploading',
					// fallback uploads must not reset progress already reported by preparation.
					progress: advanceVideoProgress(state.progress, phase, 0),
					preparationSkipped: action.preparationSkipped,
					dimensions: getPayloadDimensions(action.payload),
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
					dimensions: state.dimensions,
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
					dimensions: state.dimensions,
					pendingPublish: { blobRef: action.blobRef },
				};
			}
			break;
		}
	}

	console.error(`Unexpected video action (${action.type}) while in ${state.status} state`);
	return state;
}

// #region processing

type ProcessVideoOptions = {
	attachment: VideoAttachment;
	/** the posting account, whose avatar appears in voice clips */
	did: Did;
	dispatch: (action: VideoAction) => void;
	pds: Client;
	pdsUrl: string;
	signal: AbortSignal;
};

const prepareVideo = async (
	asset: VideoAsset,
	{ dispatch, signal }: ProcessVideoOptions,
): Promise<VideoPayload | undefined> => {
	// createVideoState already selects uploading when these APIs are unavailable.
	if (!canTranscode(asset.kind)) {
		return toVideoPayload(asset);
	}

	let transcoded;
	try {
		transcoded = await transcodeForUpload({
			kind: asset.kind,
			blob: asset.blob,
			signal,
			setProgress: (progress) => {
				dispatch({ type: 'updateProgress', progress, signal });
			},
		});
	} catch (e) {
		const message = getUploadErrorMessage(e);
		if (message !== null) {
			dispatch({ type: 'toError', error: message, signal });
		}
		return undefined;
	}

	const payload = transcoded ?? toVideoPayload(asset);
	dispatch({ type: 'preparingToUploading', payload, preparationSkipped: transcoded === undefined, signal });
	return payload;
};

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

const prepareVoice = async (
	asset: VoiceAsset,
	{ did, dispatch, pdsUrl, signal }: ProcessVideoOptions,
): Promise<VideoPayload | undefined> => {
	let payload;
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
			return undefined;
		}

		console.error('Failed to render voice clip', e);
		dispatch({ type: 'toError', error: getRenderErrorMessage(e, asset), signal });
		return undefined;
	}

	dispatch({ type: 'preparingToUploading', payload, preparationSkipped: false, signal });
	return payload;
};

/**
 * prepares, uploads, and waits for server processing; dispatches progress and errors.
 *
 * @param options source, account, upload clients, dispatcher, and cancellation signal
 * @returns resolves after completion, failure, or cancellation; cancellation dispatches no error
 */
export async function processVideo(options: ProcessVideoOptions) {
	const { attachment } = options;

	let payload: VideoPayload | undefined;
	switch (attachment.type) {
		case 'video': {
			payload = await prepareVideo(attachment.asset, options);
			break;
		}
		case 'voice': {
			payload = await prepareVoice(attachment.asset, options);
			break;
		}
	}

	if (payload !== undefined) {
		const { dispatch, pds, pdsUrl, signal } = options;
		await uploadAndProcessVideo({ payload, dispatch, pds, pdsUrl, signal });
	}
}

// #endregion
