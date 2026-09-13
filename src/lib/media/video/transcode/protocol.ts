import type { VideoUploadMimeType } from '#/lib/constants/video';
import type { VideoAssetKind } from '#/lib/media/video/types';

export type TranscodedAsset = {
	/** source kind, preserved for post presentation */
	kind: VideoAssetKind;
	blob: Blob;
	width: number;
	height: number;
	mimeType: VideoUploadMimeType;
	/** duration in milliseconds */
	duration: number;
};

/** deinterleaved audio, one array per channel, all the same length. */
export type PcmAudio = {
	channels: Float32Array<ArrayBuffer>[];
	/** sample rate in hertz */
	sampleRate: number;
};

export type VoiceClipInput = {
	audio: PcmAudio;
	/** avatar artwork; must not taint a canvas */
	avatar: ImageBitmap;
	/** localized text for the bottom-right corner */
	label: string;
	/** halo animation seed */
	seed: string;
};

export type MainToWorker = { type: VideoAssetKind; blob: Blob } | ({ type: 'voice' } & VoiceClipInput);

export type WorkerToMain =
	| { type: 'progress'; progress: number }
	| { type: 'skipped'; reason: string }
	| { type: 'done'; asset: TranscodedAsset }
	| { type: 'error'; message: string };

export type TranscodeOutcome = Extract<WorkerToMain, { type: 'done' | 'skipped' }>;
