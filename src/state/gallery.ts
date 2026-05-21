import { nanoid } from 'nanoid/non-secure';

import { compressPostImage, compressProfileImage as compressProfileBlob } from '#/lib/media/image';
import { getImageDim } from '#/lib/media/manip';
import { type PickerImage } from '#/lib/media/picker.shared';

/** A pixel-space rectangle to crop an image down to. */
export type ImageCrop = {
	height: number;
	originX: number;
	originY: number;
	width: number;
};

export type ImageTransformation = {
	crop?: ImageCrop;
};

export type ImageMeta = {
	path: string;
	width: number;
	height: number;
	mime: string;
};

export type ImageSource = ImageMeta & {
	id: string;
};

type ComposerImageBase = {
	alt: string;
	source: ImageSource;
	/** Original localRef path from draft, if editing an existing draft. Used to reuse the same storage key. */
	localRefPath?: string;
};
type ComposerImageWithoutTransformation = ComposerImageBase & {
	transformed?: undefined;
	manips?: undefined;
};
type ComposerImageWithTransformation = ComposerImageBase & {
	transformed: ImageMeta;
	manips?: ImageTransformation;
};

export type ComposerImage = ComposerImageWithoutTransformation | ComposerImageWithTransformation;

export async function createComposerImage(raw: ImageMeta): Promise<ComposerImageWithoutTransformation> {
	return {
		alt: '',
		source: {
			id: nanoid(),
			// Copy to cache to ensure file survives OS temporary file cleanup
			path: await copyToCache(raw.path),
			width: raw.width,
			height: raw.height,
			mime: raw.mime,
		},
	};
}

export type InitialImage = {
	uri: string;
	width: number;
	height: number;
	altText?: string;
};

export function createInitialImages(uris: InitialImage[] = []): ComposerImageWithoutTransformation[] {
	return uris.map(({ uri, width, height, altText = '' }) => {
		return {
			alt: altText,
			source: {
				id: nanoid(),
				path: uri,
				width: width,
				height: height,
				mime: 'image/jpeg',
			},
		};
	});
}

export async function pasteImage(uri: string): Promise<ComposerImageWithoutTransformation> {
	const { width, height } = await getImageDim(uri);
	const match = /^data:(.+?);/.exec(uri);

	return {
		alt: '',
		source: {
			id: nanoid(),
			path: uri,
			width: width,
			height: height,
			mime: match ? match[1]! : 'image/jpeg',
		},
	};
}

export async function manipulateImage(
	img: ComposerImage,
	trans: ImageTransformation,
): Promise<ComposerImage> {
	if (trans.crop === undefined) {
		if (img.transformed === undefined) {
			return img;
		}

		return { alt: img.alt, source: img.source };
	}

	const cropped = await cropImage(img.source.path, trans.crop);

	return {
		alt: img.alt,
		source: img.source,
		transformed: {
			path: cropped.path,
			width: cropped.width,
			height: cropped.height,
			mime: 'image/png',
		},
		manips: trans,
	};
}

/** Crop an image to a pixel rectangle, re-encoding the result losslessly as a PNG data URI. */
async function cropImage(uri: string, crop: ImageCrop): Promise<ImageMeta> {
	const image = new Image();
	image.src = uri;
	await image.decode();

	const canvas = new OffscreenCanvas(crop.width, crop.height);
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to create image cropping canvas');
	}

	ctx.drawImage(image, crop.originX, crop.originY, crop.width, crop.height, 0, 0, crop.width, crop.height);

	const blob = await canvas.convertToBlob({ type: 'image/png' });
	return {
		path: await blobToDataUri(blob),
		width: crop.width,
		height: crop.height,
		mime: 'image/png',
	};
}

export function resetImageManipulation(img: ComposerImage): ComposerImageWithoutTransformation {
	if (img.transformed !== undefined) {
		return { alt: img.alt, source: img.source };
	}

	return img;
}

/** Compress an image for use as a post embed, fitting the Bluesky CDN's size budget. */
export async function compressImage(img: ComposerImage): Promise<PickerImage> {
	const source = img.transformed || img.source;
	const { blob, aspectRatio } = await compressPostImage(await uriToBlob(source.path));

	return {
		path: await blobToDataUri(blob),
		width: aspectRatio.width,
		height: aspectRatio.height,
		mime: blob.type,
		size: blob.size,
	};
}

/** Compress an image for use as a profile avatar or banner, cropping it to `maxWidth`×`maxHeight`. */
export async function compressProfileImage(
	img: ComposerImage,
	maxWidth: number,
	maxHeight: number,
): Promise<PickerImage> {
	const source = img.transformed || img.source;
	const { blob, aspectRatio } = await compressProfileBlob(await uriToBlob(source.path), maxWidth, maxHeight);

	return {
		path: await blobToDataUri(blob),
		width: aspectRatio.width,
		height: aspectRatio.height,
		mime: blob.type,
		size: blob.size,
	};
}

/** Fetch a `data:`, `blob:`, or remote URI into a Blob. */
async function uriToBlob(uri: string): Promise<Blob> {
	const response = await fetch(uri);
	return await response.blob();
}

/**
 * Copy a file from a potentially temporary location to our cache directory. This ensures picker files are
 * available for draft saving even if the original temporary files are cleaned up by the OS.
 *
 * On web, converts blob URLs to data URIs immediately to prevent revocation issues.
 */
async function copyToCache(from: string): Promise<string> {
	// Data URIs don't need any conversion
	if (from.startsWith('data:')) {
		return from;
	}

	// Web: convert blob URLs to data URIs before they can be revoked
	if (from.startsWith('blob:')) {
		try {
			const response = await fetch(from);
			const blob = await response.blob();
			return await blobToDataUri(blob);
		} catch (e) {
			// Blob URL was likely revoked, return as-is for downstream error handling
			return from;
		}
	}
	// Other URLs on web don't need conversion
	return from;
}

/** Convert a Blob to a data URI */
function blobToDataUri(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to convert blob to data URI'));
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

/** Purge files that were created to accomodate image manipulation */
export async function purgeTemporaryImageFiles() {}
