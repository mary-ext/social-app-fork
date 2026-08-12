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

export async function manipulateImage(
	img: ComposerImage,
	trans: ImageTransformation,
): Promise<ComposerImage> {
	if (trans.crop === undefined) {
		if (img.transformed === undefined) {
			return img;
		}

		return { alt: img.alt, localRefPath: img.localRefPath, source: img.source };
	}

	const transformed = await cropImage(img.source.blob, trans.crop);

	return {
		alt: img.alt,
		localRefPath: img.localRefPath,
		source: img.source,
		transformed,
		manips: trans,
	};
}

/** Turn an image by `crop.rotation`, cut it down to `crop`, and re-encode the result losslessly as a PNG. */
async function cropImage(blob: Blob, crop: ImageCrop): Promise<ImageMeta> {
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
	img: ComposerImage,
	maxWidth: number,
	maxHeight: number,
): Promise<ImageMeta> {
	const source = img.transformed || img.source;
	const { blob, aspectRatio } = await compressProfileBlob(source.blob, maxWidth, maxHeight);

	return {
		blob,
		width: aspectRatio.width,
		height: aspectRatio.height,
	};
}
