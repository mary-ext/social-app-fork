import type { Did } from '@atcute/lexicons';

import { isAbortError } from '#/lib/errors';
import { clamp } from '#/lib/utils/numbers';
import { limitConcurrency } from '#/lib/utils/task';

import { getClients, getCurrentDid } from '#/state/session';

import { m } from '#/paraglide/messages';

import { getAttachmentRejectionMessage } from '../attachment-messages';
import { readAttachment } from '../read-attachment';
import { canTranscode } from '../transcode/capabilities';
import { TranscodeError } from '../transcode/errors';
import { renderVoiceClip, transcodeForUpload } from '../transcode/transcode';
import { toVideoPayload, type VideoAsset, type VideoPayload, type VoiceAsset } from '../video-asset';
import { getUploadErrorMessage, uploadToVideoService } from './video-service';
import { type ProcessVideoFile, type UploadStep, VideoUploadError } from './video-uploads';

type PreparedVideo = {
	payload: VideoPayload;
	/** true when uploading the original file. */
	preparationSkipped: boolean;
};

type ProgressPhase = 'preparing' | 'uploading' | 'uploadingWithoutPreparation' | 'processing';

const PHASE_RANGES: Record<ProgressPhase, [start: number, end: number]> = {
	preparing: [0, 0.375],
	uploading: [0.375, 0.75],
	uploadingWithoutPreparation: [0, 0.75],
	processing: [0.75, 1],
};

// serialize preparation to limit encoder CPU and memory use.
const prepareSerially = limitConcurrency(1, (prepare: () => Promise<PreparedVideo>) => prepare());

/**
 * prepares an attachment and uploads it through the video service.
 *
 * @param file the attachment's file
 * @param options progress reporting and cancellation; see {@link ProcessVideoFile}
 * @returns the processed video
 * @throws {VideoUploadError} if preparation, upload, or processing fails
 * @throws the signal's abort reason on cancellation
 */
export const processVideoFile: ProcessVideoFile = async (file, { setState, signal }) => {
	try {
		return await runPipeline(file, { setState, signal });
	} catch (err) {
		if (signal.aborted || err instanceof VideoUploadError) {
			throw err;
		}
		throw new VideoUploadError(getUploadErrorMessage(err));
	}
};

const runPipeline: ProcessVideoFile = async (file, { setState, signal }) => {
	const { pds, pdsUrl } = getClients();
	const did = getCurrentDid();
	if (!pds || !pdsUrl || !did) {
		throw new VideoUploadError(m['features.composer.media.video.error.signedOut']());
	}

	// phase changes must not move overall progress backwards.
	let progress = 0;
	const report = (status: UploadStep, phase: ProgressPhase, phaseProgress: number) => {
		const [start, end] = PHASE_RANGES[phase];
		const stepProgress = clamp(phaseProgress, 0, 1);

		progress = Math.max(progress, start + (end - start) * stepProgress);
		setState({ status, progress, stepProgress });
	};

	const read = await readAttachment(file);
	signal.throwIfAborted();
	if (!read.ok) {
		throw new VideoUploadError(getAttachmentRejectionMessage(read.rejection));
	}

	const { attachment } = read;
	const setProgress = (value: number) => {
		report('compressing', 'preparing', value);
	};

	const { payload, preparationSkipped } = await prepareSerially(async () => {
		signal.throwIfAborted();

		switch (attachment.type) {
			case 'image': {
				throw new VideoUploadError(m['features.composer.media.video.error.processInvalid']());
			}
			case 'video': {
				return prepareVideo(attachment.asset, { setProgress, signal });
			}
			case 'voice': {
				const rendered = await prepareVoice(attachment.asset, { did, pdsUrl, setProgress, signal });
				return { payload: rendered, preparationSkipped: false };
			}
		}
	});

	const uploadPhase = preparationSkipped ? 'uploadingWithoutPreparation' : 'uploading';
	report('uploading', uploadPhase, 0);

	const blob = await uploadToVideoService(payload, {
		pds,
		pdsUrl,
		signal,
		onUploadProgress(sent) {
			report('uploading', uploadPhase, sent);
		},
		onProcessing(value) {
			report('processing', 'processing', value);
		},
	});

	return { blob, width: payload.width, height: payload.height };
};

const prepareVideo = async (
	asset: VideoAsset,
	{ setProgress, signal }: { setProgress: (progress: number) => void; signal: AbortSignal },
): Promise<PreparedVideo> => {
	if (!canTranscode(asset.kind)) {
		return { payload: toVideoPayload(asset), preparationSkipped: true };
	}

	let transcoded;
	try {
		transcoded = await transcodeForUpload({ kind: asset.kind, blob: asset.blob, setProgress, signal });
	} catch (err) {
		if (err instanceof TranscodeError && err.code === 'videoUndecodable') {
			throw new VideoUploadError(m['features.composer.media.video.error.undecodable']());
		}
		throw err;
	}

	return { payload: transcoded ?? toVideoPayload(asset), preparationSkipped: transcoded === undefined };
};

const prepareVoice = async (
	asset: VoiceAsset,
	{
		did,
		pdsUrl,
		setProgress,
		signal,
	}: {
		did: Did;
		pdsUrl: string;
		setProgress: (progress: number) => void;
		signal: AbortSignal;
	},
): Promise<VideoPayload> => {
	try {
		return await renderVoiceClip({
			audio: asset.blob,
			did,
			label: m['features.composer.media.voice.cardLabel'](),
			pdsUrl,
			seed: crypto.randomUUID(),
			// the tile previews the audio itself, not the rendered card.
			setBackground: () => {},
			setProgress,
			signal,
		});
	} catch (err) {
		if (isAbortError(err)) {
			throw err;
		}

		console.error('failed to render voice clip', err);
		throw new VideoUploadError(getRenderErrorMessage(err, asset));
	}
};

const getRenderErrorMessage = (err: unknown, asset: VoiceAsset): string => {
	switch (err instanceof TranscodeError ? err.code : 'unknown') {
		case 'audioTooLong': {
			return getAttachmentRejectionMessage({ reason: 'tooLong', kind: 'voice' });
		}
		case 'audioUnreadable': {
			return getAttachmentRejectionMessage({
				reason: 'unsupported',
				kind: 'voice',
				mimeType: asset.blob.type,
			});
		}
		case 'unknown':
		case 'videoUndecodable': {
			return m['features.composer.media.voice.error.render']();
		}
	}
};
