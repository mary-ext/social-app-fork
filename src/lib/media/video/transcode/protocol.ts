import type { Did } from '@atcute/lexicons';

import type { VideoUploadMimeType } from '#/lib/constants/video';
import type { VideoAssetKind } from '#/lib/media/video/types';

import type { TranscodeErrorCode } from './errors';

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

export type VoiceClipInput = {
	/** audio file in any container mediabunny can read */
	audio: Blob;
	/** account whose avatar the card shows */
	did: Did;
	/** localized text for the bottom-right corner */
	label: string;
	/** URL of the account's PDS */
	pdsUrl: string;
	/** halo animation seed */
	seed: string;
};

export type MainToWorker = { type: VideoAssetKind; blob: Blob } | ({ type: 'voice' } & VoiceClipInput);

export type WorkerToMain =
	| { type: 'progress'; progress: number }
	/** a voice clip card's CSS background color, sent once its avatar loads */
	| { type: 'voiceBackground'; color: string }
	| { type: 'skipped'; reason: string }
	| { type: 'done'; asset: TranscodedAsset }
	| { type: 'error'; code: TranscodeErrorCode; message: string };

export type TranscodeOutcome = Extract<WorkerToMain, { type: 'done' | 'skipped' }>;
