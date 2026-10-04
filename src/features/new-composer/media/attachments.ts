import type { Plot } from 'wordgard/doc';

import type { Gif } from '#/lib/media/external-gif/types';
import { getImageDimensions } from '#/lib/media/metadata';
import {
	type Attachment,
	type AttachmentKind,
	type AttachmentRejection,
	readAttachment,
} from '#/lib/media/read-attachment';
import type { VideoAsset } from '#/lib/media/video/types';

import type { SelectionError } from '#/features/composer/media/select-attachments';
import { MAX_GALLERY_IMAGES } from '#/features/composer/state/composer';

import { getAspectRatio } from '#/components/ImageEmbed/carousel/utils';

import { getPostParam, getPosts, type PostMedia } from '../model/schema';

// GIF picker results share the local GIF's one-per-post rule.
const toAttachmentKind = (item: PostMedia): AttachmentKind => {
	return item.kind === 'externalGif' ? 'gif' : item.kind;
};

/**
 * checks media type and count limits. excess media is allowed during editing.
 *
 * @param media the post's media
 * @returns the type or count violation, or null
 */
export const getMediaProblem = (media: readonly PostMedia[]): SelectionError | null => {
	const [first, ...rest] = media;
	if (!first) {
		return null;
	}

	const kind = toAttachmentKind(first);
	if (rest.some((item) => toAttachmentKind(item) !== kind)) {
		return { type: 'mixedTypes' };
	}
	if (kind === 'image') {
		return media.length > MAX_GALLERY_IMAGES ? { type: 'maxImages' } : null;
	}

	// non-image attachments need the post's only media embed.
	return media.length > 1 ? { type: 'oneOnly', kind } : null;
};

/** a video, local GIF, or voice clip; all publish as video embeds. */
export type VideoUploadMedia = Extract<PostMedia, { kind: 'gif' | 'video' | 'voice' }>;

/**
 * checks whether an attachment publishes as a video embed.
 *
 * @param item the attachment
 * @returns whether it is {@link VideoUploadMedia}
 */
export const isVideoUploadMedia = (item: PostMedia): item is VideoUploadMedia => {
	switch (item.kind) {
		case 'gif':
		case 'video':
		case 'voice': {
			return true;
		}
		case 'externalGif':
		case 'image': {
			return false;
		}
	}
};

/**
 * collects the files of attachments that publish as video embeds.
 *
 * @param doc the thread document
 * @returns unique files by object identity
 */
export const getVideoUploadFiles = (doc: Plot.Doc): Set<File> => {
	const files = new Set<File>();
	for (const { node } of getPosts(doc)) {
		for (const item of getPostParam(node).media) {
			if (isVideoUploadMedia(item)) {
				files.add(item.file);
			}
		}
	}

	return files;
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

/**
 * creates an external GIF attachment.
 *
 * @param gif a GIF picker result
 * @returns an attachment with a new id
 */
export const createGifMedia = (gif: Gif): PostMedia => {
	const [width, height] = gif.media_formats.gif.dims;
	return {
		id: crypto.randomUUID(),
		kind: 'externalGif',
		gif,
		aspectRatio: getAspectRatio({ width, height }),
	};
};

/**
 * creates a video or GIF attachment.
 *
 * @param asset source video and metadata
 * @returns an attachment with a new id
 */
export const createVideoMedia = (asset: VideoAsset): PostMedia => {
	const file = new File([asset.blob], 'video', { type: asset.mimeType });
	return toVideoMedia(crypto.randomUUID(), file, asset);
};

const toVideoMedia = (id: string, file: File, asset: VideoAsset): PostMedia => {
	return {
		id,
		kind: asset.kind,
		file,
		aspectRatio: getAspectRatio(asset),
		duration: toSeconds(asset.duration),
	};
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
			return toVideoMedia(id, file, attachment.asset);
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
