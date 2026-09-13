import {
	type AttachmentKind,
	type AttachmentRejection,
	getAttachmentKind,
	readAttachment,
} from '#/lib/media/read-attachment';

import { type EmbedDraft, MAX_GALLERY_IMAGES } from '#/features/composer/state/composer';
import { getVideoSourceKind, type VideoAttachment } from '#/features/composer/state/video';

export type AttachmentSelection = { type: 'images'; blobs: Blob[] } | VideoAttachment;

export type SelectionError =
	| { type: 'rejected'; rejection: AttachmentRejection }
	| { type: 'mixedTypes' }
	| { type: 'maxImages' }
	| { type: 'oneOnly'; kind: 'gif' | 'video' | 'voice' };

export type SelectionResult = {
	selection: AttachmentSelection | undefined;
	/** in input order; may contain duplicates */
	errors: SelectionError[];
};

const getCapacity = (
	media: EmbedDraft['media'],
): { kind: AttachmentKind | 'externalGif' | undefined; imageSlots: number; full: boolean } => {
	switch (media?.type) {
		case undefined: {
			return { kind: undefined, imageSlots: MAX_GALLERY_IMAGES, full: false };
		}
		case 'images':
		case 'gallery': {
			return { kind: 'image', imageSlots: MAX_GALLERY_IMAGES - media.images.length, full: false };
		}
		case 'video': {
			return { kind: getVideoSourceKind(media.video.source), imageSlots: 0, full: true };
		}
		case 'externalGif': {
			return { kind: 'externalGif', imageSlots: 0, full: true };
		}
	}
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
	const capacity = getCapacity(media);
	let kind = capacity.kind;
	let full = capacity.full;
	const errors: SelectionError[] = [];
	const images: Blob[] = [];
	let selection: AttachmentSelection | undefined;

	for (const blob of blobs) {
		const result = await readAttachment(blob);
		if (!result.ok) {
			errors.push({ type: 'rejected', rejection: result.rejection });
			continue;
		}

		const { attachment } = result;
		const attachmentKind = getAttachmentKind(attachment);
		kind ??= attachmentKind;
		if (attachmentKind !== kind) {
			errors.push({ type: 'mixedTypes' });
			continue;
		}

		switch (attachment.type) {
			case 'image': {
				if (images.length >= capacity.imageSlots) {
					errors.push({ type: 'maxImages' });
					continue;
				}
				images.push(attachment.blob);
				selection = { type: 'images', blobs: images };
				break;
			}
			case 'video':
			case 'voice': {
				if (full) {
					errors.push({
						type: 'oneOnly',
						kind: attachment.type === 'voice' ? 'voice' : attachment.asset.kind,
					});
					continue;
				}
				full = true;
				selection = attachment;
				break;
			}
		}
	}

	return { selection, errors };
};
