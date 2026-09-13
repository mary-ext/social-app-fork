import { VIDEO_UPLOAD_MIME_TYPES } from '#/lib/constants/video';
import { readGifMetadata } from '#/lib/media/gif-metadata';
import { getAudioDuration, getImageDimensions, getVideoMetadata } from '#/lib/media/metadata';
import { canRenderVoiceClip } from '#/lib/media/transcode/capabilities';
import type { VideoAsset } from '#/lib/media/video/types';
import { isVideoDurationAdmissible, isVideoSizeAdmissible } from '#/lib/media/video/validate';

/** an audio file to be rendered as a voice clip. */
export type VoiceAsset = {
	blob: Blob;
	/** duration in milliseconds, or null when the browser could not determine it */
	duration: number | null;
};

export type Attachment =
	| { type: 'image'; blob: Blob }
	/** a video or an animated GIF, distinguished by `asset.kind` */
	| { type: 'video'; asset: VideoAsset }
	| { type: 'voice'; asset: VoiceAsset };

/** distinguishes animated GIFs from other videos. */
export type AttachmentKind = 'gif' | 'image' | 'video' | 'voice';

export type AttachmentRejection =
	| {
			reason: 'unsupported';
			/** the kind the file was recognized as, if any */
			kind: AttachmentKind | undefined;
			mimeType: string;
	  }
	| { reason: 'tooLarge'; kind: 'gif' | 'video' }
	| { reason: 'tooLong'; kind: 'gif' | 'video' | 'voice' };

export type AttachmentReadResult =
	| { ok: true; attachment: Attachment }
	| { ok: false; rejection: AttachmentRejection };

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
	'image/avif',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
	'image/webp',
]);

/**
 * distinguishes animated GIFs from other video attachments.
 *
 * @param attachment classified attachment
 * @returns attachment kind, preserving `gif` for animated GIFs
 */
export const getAttachmentKind = (attachment: Attachment): AttachmentKind => {
	switch (attachment.type) {
		case 'image':
		case 'voice': {
			return attachment.type;
		}
		case 'video': {
			return attachment.asset.kind;
		}
	}
};

const accept = (attachment: Attachment): AttachmentReadResult => ({ ok: true, attachment });

const reject = (rejection: AttachmentRejection): AttachmentReadResult => ({ ok: false, rejection });

const readAnimatedGif = async (blob: Blob, duration: number): Promise<AttachmentReadResult> => {
	const mimeType = blob.type;
	if (!isVideoSizeAdmissible('gif', blob.size)) {
		return reject({ reason: 'tooLarge', kind: 'gif' });
	}
	if (!isVideoDurationAdmissible(duration)) {
		return reject({ reason: 'tooLong', kind: 'gif' });
	}

	let dimensions;
	try {
		dimensions = await getImageDimensions(blob);
	} catch {
		return reject({ reason: 'unsupported', kind: 'gif', mimeType });
	}

	return accept({
		type: 'video',
		asset: { kind: 'gif', blob, ...dimensions, mimeType, duration },
	});
};

const readVideo = async (blob: Blob): Promise<AttachmentReadResult> => {
	const mimeType = blob.type;
	if (!VIDEO_UPLOAD_MIME_TYPES.some((supported) => supported === mimeType)) {
		return reject({ reason: 'unsupported', kind: 'video', mimeType });
	}
	if (!isVideoSizeAdmissible('video', blob.size)) {
		return reject({ reason: 'tooLarge', kind: 'video' });
	}

	let metadata;
	try {
		metadata = await getVideoMetadata(blob);
	} catch {
		return reject({ reason: 'unsupported', kind: 'video', mimeType });
	}

	if (metadata.duration === null) {
		return reject({ reason: 'unsupported', kind: 'video', mimeType });
	}
	if (!isVideoDurationAdmissible(metadata.duration)) {
		return reject({ reason: 'tooLong', kind: 'video' });
	}

	return accept({
		type: 'video',
		asset: {
			kind: 'video',
			blob,
			width: metadata.width,
			height: metadata.height,
			mimeType,
			duration: metadata.duration,
		},
	});
};

const readVoice = async (blob: Blob): Promise<AttachmentReadResult> => {
	const mimeType = blob.type;
	if (!canRenderVoiceClip()) {
		return reject({ reason: 'unsupported', kind: 'voice', mimeType });
	}

	let duration;
	try {
		duration = await getAudioDuration(blob);
	} catch {
		return reject({ reason: 'unsupported', kind: 'voice', mimeType });
	}

	// the renderer checks the decoded length when the browser can't report one.
	if (duration !== null && !isVideoDurationAdmissible(duration)) {
		return reject({ reason: 'tooLong', kind: 'voice' });
	}

	return accept({ type: 'voice', asset: { blob, duration } });
};

/**
 * classifies and validates a file for attaching to a post.
 *
 * still images are checked by MIME type only; callers must validate image contents.
 *
 * @param blob the file, with its MIME type set
 * @returns the attachment, or why the file can't be attached
 * @throws if the GIF blob cannot be read
 */
export const readAttachment = async (blob: Blob): Promise<AttachmentReadResult> => {
	const mimeType = blob.type;

	if (mimeType === 'image/gif') {
		const { frames, durationUs } = readGifMetadata(new Uint8Array(await blob.arrayBuffer()));
		if (frames > 1) {
			return readAnimatedGif(blob, durationUs / 1000);
		}
	}
	if (mimeType.startsWith('image/')) {
		if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
			return reject({ reason: 'unsupported', kind: 'image', mimeType });
		}
		return accept({ type: 'image', blob });
	}
	if (mimeType.startsWith('video/')) {
		return readVideo(blob);
	}
	if (mimeType.startsWith('audio/')) {
		return readVoice(blob);
	}

	return reject({ reason: 'unsupported', kind: undefined, mimeType });
};
