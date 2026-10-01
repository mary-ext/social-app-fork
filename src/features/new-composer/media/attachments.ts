import { getImageDimensions } from '#/lib/media/metadata';
import { type Attachment, type AttachmentRejection, readAttachment } from '#/lib/media/read-attachment';
import { getBlobUrl } from '#/lib/utils/blob-url';

import type { SelectionError } from '#/features/composer/media/select-attachments';
import { MAX_GALLERY_IMAGES } from '#/features/composer/state/composer';

import { getAspectRatio } from '#/components/ImageEmbed/carousel/utils';

import type { PostMedia } from '../editor/schema';

/**
 * checks media type and count limits. excess media is allowed during editing.
 *
 * @param media the post's media
 * @returns the type or count violation, or null
 */
export const getMediaProblem = (media: readonly PostMedia[]): SelectionError | null => {
	// GIFs and voice notes also publish as video embeds.
	const images = media.filter((item) => item.kind === 'image').length;
	const videos = media.length - images;

	if (images > 0 && videos > 0) {
		return { type: 'mixedTypes' };
	}
	if (images > MAX_GALLERY_IMAGES) {
		return { type: 'maxImages' };
	}
	if (videos > 1) {
		return { type: 'oneOnly', kind: 'video' };
	}

	return null;
};

/**
 * classifies and validates files for attaching, without uploading them.
 *
 * @param files the picked or dropped files
 * @returns accepted media and file rejections
 */
export const createMedia = async (
	files: Iterable<File>,
): Promise<{ media: PostMedia[]; rejections: AttachmentRejection[] }> => {
	const read = await Promise.all(
		[...files].map(async (file) => {
			return { file, result: await readAttachment(file) };
		}),
	);

	const media: Promise<PostMedia>[] = [];
	const rejections: AttachmentRejection[] = [];
	for (const { file, result } of read) {
		if (result.ok) {
			media.push(toPostMedia(file, result.attachment));
		} else {
			rejections.push(result.rejection);
		}
	}

	return { media: await Promise.all(media), rejections };
};

const toPostMedia = async (file: File, attachment: Attachment): Promise<PostMedia> => {
	const id = crypto.randomUUID();
	switch (attachment.type) {
		case 'image': {
			let dimensions;
			try {
				dimensions = await getImageDimensions(attachment.blob);
			} catch {
				// fall back to square sizing if dimensions can't be read.
			}

			return {
				id,
				kind: 'image',
				file,
				dimensions,
			};
		}
		case 'video': {
			const { asset } = attachment;
			return {
				id,
				kind: asset.kind,
				file,
				aspectRatio: getAspectRatio(asset),
				duration: toSeconds(asset.duration),
			};
		}
		case 'voice': {
			return {
				id,
				kind: 'voice',
				file,
				duration: toSeconds(attachment.asset.duration),
			};
		}
	}
};

const toSeconds = (ms: number | null): number | undefined => {
	return ms === null ? undefined : ms / 1000;
};

/**
 * returns a cached preview URL for an attachment.
 *
 * @param item the media entry
 * @returns an object URL valid for the file's lifetime
 */
export const getMediaUrl = (item: PostMedia): string => {
	return getBlobUrl(item.file);
};
