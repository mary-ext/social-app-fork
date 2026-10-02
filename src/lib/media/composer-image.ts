import {
	compressPostImage,
	compressProfileImage as compressProfileBlob,
	getImageFromBlob,
} from './compress-image';

export type ImageCrop = {
	rotation: 0 | 1 | 2 | 3;
	height: number;
	originX: number;
	originY: number;
	width: number;
};

export type ImageTransformation = {
	crop?: ImageCrop;
	ratio?: number | null;
};

export type ImageMeta = {
	blob: Blob;
	width: number;
	height: number;
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

/**
 * Create a composer image from a raw image blob, decoding it to read its dimensions.
 *
 * @param blob source image blob
 * @returns a composer image with no transformation applied
 * @throws if the blob could not be loaded as an image
 */
export async function createComposerImage(blob: Blob): Promise<ComposerImageWithoutTransformation> {
	const image = await getImageFromBlob(blob);

	return {
		alt: '',
		source: {
			id: crypto.randomUUID(),
			blob,
			width: image.naturalWidth,
			height: image.naturalHeight,
		},
	};
}

/**
 * rotates and crops an image, returning a PNG.
 *
 * @param blob source image
 * @param crop pixel rectangle in rotated coordinates; rotation is clockwise quarter-turns
 * @returns the PNG blob and cropped dimensions
 * @throws if decoding, canvas creation, or PNG encoding fails
 */
export async function cropImage(blob: Blob, crop: ImageCrop): Promise<ImageMeta> {
	const image = await getImageFromBlob(blob);

	const canvas = new OffscreenCanvas(crop.width, crop.height);
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to create image cropping canvas');
	}

	const { naturalWidth: w, naturalHeight: h } = image;

	// map source pixels onto the canvas in two steps, read bottom-up: turn the source into the rotated space the
	// rectangle is expressed in, then shift that space so the rectangle's origin lands at the canvas origin.
	ctx.translate(-crop.originX, -crop.originY);
	switch (crop.rotation) {
		case 1: {
			ctx.translate(h, 0);
			ctx.rotate(Math.PI / 2);
			break;
		}
		case 2: {
			ctx.translate(w, h);
			ctx.rotate(Math.PI);
			break;
		}
		case 3: {
			ctx.translate(0, w);
			ctx.rotate(-Math.PI / 2);
			break;
		}
	}

	ctx.drawImage(image, 0, 0);

	return {
		blob: await canvas.convertToBlob({ type: 'image/png' }),
		width: crop.width,
		height: crop.height,
	};
}

/** Compress an image for use as a post embed, fitting the Bluesky CDN's size budget. */
export async function compressImage(img: ComposerImage): Promise<ImageMeta> {
	const source = img.transformed || img.source;
	const { blob, aspectRatio } = await compressPostImage(source.blob);

	return {
		blob,
		width: aspectRatio.width,
		height: aspectRatio.height,
	};
}

/** Compress an image for use as a profile avatar or banner, cropping it to `maxWidth`×`maxHeight`. */
export async function compressProfileImage(
	img: ImageMeta,
	maxWidth: number,
	maxHeight: number,
): Promise<ImageMeta> {
	const { blob, aspectRatio } = await compressProfileBlob(img.blob, maxWidth, maxHeight);

	return {
		blob,
		width: aspectRatio.width,
		height: aspectRatio.height,
	};
}
