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

export type MainToWorker = { kind: VideoAssetKind; blob: Blob };

export type WorkerToMain =
	| { type: 'progress'; progress: number }
	| { type: 'skipped'; reason: string }
	| { type: 'done'; asset: TranscodedAsset }
	| { type: 'error'; message: string };

export type TranscodeOutcome = Extract<WorkerToMain, { type: 'done' | 'skipped' }>;
