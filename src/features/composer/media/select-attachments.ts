import {
	type AttachmentKind,
	type AttachmentRejection,
	getAttachmentKind,
	readAttachment,
	type VideoAttachmentKind,
} from '#/lib/media/read-attachment';

import { type EmbedDraft, MAX_GALLERY_IMAGES } from '#/features/composer/state/composer';
import { getVideoSourceKind, type VideoAttachment } from '#/features/composer/state/video';

type AttachmentSelection = { type: 'images'; blobs: Blob[] } | VideoAttachment;

export type SelectionError =
	| { type: 'rejected'; rejection: AttachmentRejection }
	| { type: 'mixedTypes' }
	| { type: 'maxImages' }
	| { type: 'oneOnly'; kind: VideoAttachmentKind };

type SelectionResult = {
	selection: AttachmentSelection | undefined;
	/** in input order; may contain duplicates */
	errors: SelectionError[];
};

type MediaCapacity = {
	/** the kind further attachments must match, if any */
	kind: AttachmentKind | 'externalGif' | undefined;
	imageSlots: number;
	full: boolean;
};

/**
 * reports remaining media capacity.
 *
 * @param media the post's current media
 * @returns media kind constraint, image slots, and full status
 */
export const getMediaCapacity = (media: EmbedDraft['media']): MediaCapacity => {
	switch (media?.type) {
		case undefined: {
			return { kind: undefined, imageSlots: MAX_GALLERY_IMAGES, full: false };
		}
		case 'images':
		case 'gallery': {
			const imageSlots = MAX_GALLERY_IMAGES - media.images.length;
			return { kind: 'image', imageSlots, full: imageSlots <= 0 };
		}
		case 'video': {
			return { kind: getVideoSourceKind(media.video.source), imageSlots: 0, full: true };
		}
		case 'externalGif': {
			return { kind: 'externalGif', imageSlots: 0, full: true };
		}
	}
};

const getKindFromMimeType = (mimeType: string): AttachmentKind | undefined => {
	// GIFs require frame inspection to distinguish still images from animations.
	if (mimeType === 'image/gif') {
		return undefined;
	}
	if (mimeType.startsWith('image/')) {
		return 'image';
	}
	if (mimeType.startsWith('video/')) {
		return 'video';
	}
	if (mimeType.startsWith('audio/')) {
		return 'voice';
	}
	return undefined;
};

/**
 * selects files within the post's media type and count limits.
 *
 * with no existing media, the first accepted file determines the kind.
 *
 * @param blobs selected, pasted, or dropped files, in order
 * @param media the post's current media
 * @returns the accepted attachments and why the rest were left out
 * @throws if a GIF blob cannot be read
 */
export const selectAttachments = async (
	blobs: Blob[],
	media: EmbedDraft['media'],
): Promise<SelectionResult> => {
	const capacity = getMediaCapacity(media);
	let kind = capacity.kind;
	let full = capacity.full;
	const errors: SelectionError[] = [];
	const images: Blob[] = [];
	let selection: AttachmentSelection | undefined;

	const getFitError = (attachmentKind: AttachmentKind): SelectionError | undefined => {
		if (kind !== undefined && attachmentKind !== kind) {
			return { type: 'mixedTypes' };
		}
		if (attachmentKind === 'image') {
			return images.length >= capacity.imageSlots ? { type: 'maxImages' } : undefined;
		}
		return full ? { type: 'oneOnly', kind: attachmentKind } : undefined;
	};

	for (const blob of blobs) {
		// avoid metadata reads for files ruled out by MIME type.
		const expectedKind = getKindFromMimeType(blob.type);
		const earlyError = expectedKind !== undefined ? getFitError(expectedKind) : undefined;
		if (earlyError !== undefined) {
			errors.push(earlyError);
			continue;
		}

		const result = await readAttachment(blob);
		if (!result.ok) {
			errors.push({ type: 'rejected', rejection: result.rejection });
			continue;
		}

		const { attachment } = result;
		const attachmentKind = getAttachmentKind(attachment);
		const error = getFitError(attachmentKind);
		if (error !== undefined) {
			errors.push(error);
			continue;
		}
		kind ??= attachmentKind;

		switch (attachment.type) {
			case 'image': {
				images.push(attachment.blob);
				selection = { type: 'images', blobs: images };
				break;
			}
			case 'video':
			case 'voice': {
				full = true;
				selection = attachment;
				break;
			}
		}
	}

	return { selection, errors };
};
