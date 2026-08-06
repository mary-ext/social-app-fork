import type { AppBskyEmbedDefs } from '@atcute/bluesky';

import { remove as removeExif } from '@mary/exif-rm';

import { limitConcurrency } from '#/lib/async/task';
import { ALT_TEXT_MIME_TYPES } from '#/lib/lexicons/internal-app';

import { cover } from './crop';

const MAX_CONCURRENT_COMPRESSIONS = 2;

const POST_MAX_BYTES = 2_000_000;
const DEFAULT_MAX_BYTES = 1_000_000;
const ALT_TEXT_MAX_BYTES = 600_000;

// matches the largest dimensions the bluesky image CDN will serve
const POST_MAX_DIM = 4_000;
const LINK_THUMB_MAX_DIM = 2_000;

// #region vision budget

/** block size produced by Gemma 4's vision encoder. */
const VISION_BLOCK = 48;

/** maximum pixels represented by the encoder's 1120-token budget. */
const VISION_MAX_PIXELS = 1120 * VISION_BLOCK * VISION_BLOCK;

/** how far snapping to whole blocks may bend the aspect ratio before it stops being worth the alignment. */
const MAX_ASPECT_DRIFT = 0.03;

// #endregion

const QUALITY_STEPS = [92, 88, 84, 80] as const;
const MAX_QUALITY = QUALITY_STEPS[0];

// #region prediction table

// leave room for prediction error.
const PREDICTION_HEADROOM = 0.92;

const PREDICTION_SCALES = [1.0, 0.9, 0.8, 0.7, 0.6] as const;

/** estimated encoded-size ratios by scale and quality. */
const PREDICTION_RATIOS: readonly (readonly number[])[] = [
	[1.0, 0.8, 0.656, 0.558],
	[0.809, 0.618, 0.501, 0.421],
	[0.686, 0.526, 0.427, 0.361],
	[0.579, 0.447, 0.362, 0.307],
	[0.469, 0.367, 0.295, 0.248],
];

// #endregion

// #region iterative fallback

const MAX_ATTEMPTS = 8;
// trade off quality after dimensions have dropped.
const SOFT_MIN_SCALE = 0.8;
// keep at least 60% of the fitted dimensions when possible.
const HARD_MIN_SCALE = 0.6;
// aim below the byte budget to allow for prediction error.
const TARGET_HEADROOM = 0.95;

// #endregion

const enum Crop {
	CONTAIN,
	COVER,
}

/** output dimension policy. */
type CropMode =
	| {
			type: Crop.CONTAIN;
			/** optional pixel cap, aligned to {@link VISION_BLOCK}. */
			maxPixels?: number;
	  }
	| { type: Crop.COVER };

interface CompressOptions {
	maxBytes: number;
	maxWidth: number;
	maxHeight: number;
	type: 'image/webp' | 'image/jpeg';
	crop: CropMode;
	/** source MIME types allowed to bypass re-encoding. */
	acceptedSourceTypes?: readonly string[];
}

export interface CompressResult {
	blob: Blob;
	aspectRatio: AppBskyEmbedDefs.AspectRatio;
}

export const compressPostImage = (blob: Blob): Promise<CompressResult> => {
	return compressImage(blob, {
		type: 'image/webp',
		maxBytes: POST_MAX_BYTES,
		maxHeight: POST_MAX_DIM,
		maxWidth: POST_MAX_DIM,
		crop: { type: Crop.CONTAIN },
	});
};

export const compressLinkThumbImage = (blob: Blob): Promise<CompressResult> => {
	return compressImage(blob, {
		type: 'image/webp',
		maxBytes: DEFAULT_MAX_BYTES,
		maxHeight: LINK_THUMB_MAX_DIM,
		maxWidth: LINK_THUMB_MAX_DIM,
		crop: { type: Crop.CONTAIN },
	});
};

/**
 * re-encodes an image for the alt-text model's vision budget.
 *
 * @param blob source image
 * @returns the encoded blob and its final aspect ratio
 * @throws if no attempt produces a blob within the byte budget
 */
export const compressAltTextImage = (blob: Blob): Promise<CompressResult> => {
	return compressImage(blob, {
		type: 'image/webp',
		maxBytes: ALT_TEXT_MAX_BYTES,
		// use the pixel budget instead of a bounding box so wide images keep their available area.
		maxHeight: Infinity,
		maxWidth: Infinity,
		// only accepted formats may bypass re-encoding.
		acceptedSourceTypes: ALT_TEXT_MIME_TYPES,
		crop: { type: Crop.CONTAIN, maxPixels: VISION_MAX_PIXELS },
	});
};

export const compressProfileImage = (blob: Blob, maxW: number, maxH: number): Promise<CompressResult> => {
	return compressImage(blob, {
		type: 'image/jpeg',
		maxBytes: DEFAULT_MAX_BYTES,
		maxHeight: maxH,
		maxWidth: maxW,
		acceptedSourceTypes: ['image/jpeg', 'image/png'],
		crop: { type: Crop.COVER },
	});
};

/** compresses an image to fit a byte budget. */
const compressImageUncapped = async (blob: Blob, opts: CompressOptions): Promise<CompressResult> => {
	// stripping metadata may bring the source under budget.
	blob = await stripExif(blob);

	const image = await getImageFromBlob(blob);

	// preserve an acceptable source without re-encoding.
	if (
		blob.size <= opts.maxBytes &&
		!exceedsSizeBudget(image, opts) &&
		(opts.acceptedSourceTypes === undefined || opts.acceptedSourceTypes.includes(blob.type))
	) {
		return {
			blob: blob,
			aspectRatio: { width: image.naturalWidth, height: image.naturalHeight },
		};
	}

	const [fittedW, fittedH] = computeFittedDims(
		image.naturalWidth,
		image.naturalHeight,
		opts.maxWidth,
		opts.maxHeight,
		opts.crop,
	);

	// encode the full-size anchor used by the fallback strategies.
	const anchorBlob = await encodeAt(image, fittedW, fittedH, MAX_QUALITY, opts);
	if (anchorBlob.size <= opts.maxBytes) {
		return { blob: anchorBlob, aspectRatio: { width: fittedW, height: fittedH } };
	}

	let result: CompressResult | undefined;

	// the prediction table applies only to WebP contain mode.
	if (opts.type === 'image/webp' && opts.crop.type === Crop.CONTAIN) {
		result = await compressByPrediction(image, fittedW, fittedH, anchorBlob.size, opts);
	}

	if (!result) {
		result = await compressByIteration(image, fittedW, fittedH, anchorBlob, opts);
	}

	if (!result) {
		throw new Error(`unable to compress image to fit ${opts.maxBytes} bytes`);
	}

	return result;
};

const compressImage = limitConcurrency(MAX_CONCURRENT_COMPRESSIONS, compressImageUncapped);

/**
 * encodes the highest-scoring predicted cell within the byte budget.
 *
 * @param image decoded source image
 * @param fittedW width at scale=1.0
 * @param fittedH height at scale=1.0
 * @param anchorBytes byte count of the anchor encode at maximum scale and quality
 * @param opts compression options
 * @returns the encoded result, or undefined if no cell is predicted to fit or if the actual encode exceeds
 *   the budget
 */
const compressByPrediction = async (
	image: HTMLImageElement,
	fittedW: number,
	fittedH: number,
	anchorBytes: number,
	opts: CompressOptions,
): Promise<CompressResult | undefined> => {
	const budget = opts.maxBytes * PREDICTION_HEADROOM;

	let bestScale = 0;
	let bestQuality = 0;
	let bestScore = -Infinity;

	for (let si = 0; si < PREDICTION_SCALES.length; si++) {
		const scale = PREDICTION_SCALES[si]!;
		for (let qi = 0; qi < QUALITY_STEPS.length; qi++) {
			const predicted = anchorBytes * PREDICTION_RATIOS[si]![qi]!;
			if (predicted > budget) {
				continue;
			}

			const quality = QUALITY_STEPS[qi]!;
			// weight scale and quality equally.
			const score = scale * quality;
			if (score > bestScore) {
				bestScore = score;
				bestScale = scale;
				bestQuality = quality;
			}
		}
	}

	if (bestScore === -Infinity) {
		return undefined;
	}

	const w = Math.max(1, Math.floor(fittedW * bestScale));
	const h = Math.max(1, Math.floor(fittedH * bestScale));
	const encoded = await encodeAt(image, w, h, bestQuality, opts);
	if (encoded.size <= opts.maxBytes) {
		return { blob: encoded, aspectRatio: { width: w, height: h } };
	}
	return undefined;
};

/**
 * finds an encode within budget by shrinking scale and quality.
 *
 * @param image decoded source image
 * @param fittedW width at scale 1.0
 * @param fittedH height at scale 1.0
 * @param anchorEncoded anchor encode at max quality, known to overshoot budget
 * @param opts compression options
 * @returns encoded result, or undefined if no attempt fits the budget
 */
const compressByIteration = async (
	image: HTMLImageElement,
	fittedW: number,
	fittedH: number,
	anchorEncoded: Blob,
	opts: CompressOptions,
): Promise<CompressResult | undefined> => {
	const softMinW = Math.max(1, Math.floor(fittedW * SOFT_MIN_SCALE));
	const softMinH = Math.max(1, Math.floor(fittedH * SOFT_MIN_SCALE));
	const hardMinW = Math.max(1, Math.floor(fittedW * HARD_MIN_SCALE));
	const hardMinH = Math.max(1, Math.floor(fittedH * HARD_MIN_SCALE));

	let width = fittedW;
	let height = fittedH;
	let qualityIndex = 0;
	let encoded: Blob = anchorEncoded;

	for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
		if (encoded.size <= opts.maxBytes) {
			return { blob: encoded, aspectRatio: { width, height } };
		}

		// estimate the next scale from the encoded-size ratio.
		const ratio = Math.sqrt((opts.maxBytes * TARGET_HEADROOM) / encoded.size);
		const canLowerQuality = qualityIndex < QUALITY_STEPS.length - 1;
		const hitSoftMin = width <= softMinW || height <= softMinH;
		const hitHardMin = width <= hardMinW || height <= hardMinH;

		if (canLowerQuality && hitSoftMin) {
			qualityIndex += 1;
		} else if (hitHardMin) {
			// no dimensions or quality remain to try.
			return undefined;
		} else {
			const [nextW, nextH] = computeNextDims(width, height, ratio, hardMinW, hardMinH);
			if (nextW === width && nextH === height) {
				if (!canLowerQuality) {
					return undefined;
				}
				qualityIndex += 1;
			} else {
				width = nextW;
				height = nextH;
			}
		}

		encoded = await encodeAt(image, width, height, QUALITY_STEPS[qualityIndex]!, opts);
	}

	return encoded.size <= opts.maxBytes ? { blob: encoded, aspectRatio: { width, height } } : undefined;
};

const encodeAt = (
	image: HTMLImageElement,
	w: number,
	h: number,
	quality: number,
	opts: CompressOptions,
): Promise<Blob> => {
	const canvas = renderCanvas(image, w, h, opts.crop);
	return canvas.convertToBlob({ type: opts.type, quality: quality / 100 });
};

/**
 * removes EXIF metadata from a supported image blob.
 *
 * @param blob source image
 * @returns a blob with EXIF removed, or the original blob if no stripping was applied
 */
const stripExif = async (blob: Blob): Promise<Blob> => {
	const stripped = removeExif(new Uint8Array(await blob.arrayBuffer()));
	if (stripped === null) {
		return blob;
	}
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `remove` allocates the returned buffer itself, so it is never shared
	return new Blob([stripped as Uint8Array<ArrayBuffer>], { type: blob.type });
};

/**
 * decode an image blob into an `HTMLImageElement`.
 *
 * @param blob source image
 * @returns the decoded image element
 * @throws if the blob could not be loaded as an image
 */
export const getImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const image = new Image();
		const blobUrl = URL.createObjectURL(blob);

		image.addEventListener(
			'load',
			() => {
				URL.revokeObjectURL(blobUrl);
				resolve(image);
			},
			{ once: true },
		);
		image.addEventListener(
			'error',
			() => {
				URL.revokeObjectURL(blobUrl);
				reject(new Error('the source image could not be loaded'));
			},
			{ once: true },
		);

		image.src = blobUrl;
	});
};

/** returns whether a contain-mode source exceeds its dimension or pixel budget. */
const exceedsSizeBudget = (image: HTMLImageElement, opts: CompressOptions): boolean => {
	if (opts.crop.type === Crop.COVER) {
		return false;
	}

	if (image.naturalWidth > opts.maxWidth || image.naturalHeight > opts.maxHeight) {
		return true;
	}

	const { maxPixels } = opts.crop;
	return maxPixels !== undefined && image.naturalWidth * image.naturalHeight > maxPixels;
};

const computeFittedDims = (
	srcW: number,
	srcH: number,
	maxW: number,
	maxH: number,
	crop: CropMode,
): [number, number] => {
	if (crop.type === Crop.COVER) {
		return [Math.max(1, maxW), Math.max(1, maxH)];
	}

	let scale = 1;
	if (srcW > maxW || srcH > maxH) {
		scale = Math.min(maxW / srcW, maxH / srcH);
	}

	if (crop.maxPixels !== undefined) {
		scale = Math.min(scale, Math.sqrt(crop.maxPixels / (srcW * srcH)));
	}

	// only snap while shrinking; snapping an already-small source loses resolution.
	if (crop.maxPixels !== undefined && scale < 1) {
		const idealW = srcW * scale;
		const idealH = srcH * scale;
		const width = Math.floor(idealW / VISION_BLOCK) * VISION_BLOCK;
		const height = Math.floor(idealH / VISION_BLOCK) * VISION_BLOCK;

		// reject snapping when it would distort a small image.
		const drift = Math.abs(width / height / (idealW / idealH) - 1);
		if (width > 0 && height > 0 && drift <= MAX_ASPECT_DRIFT) {
			return [width, height];
		}
	}

	return [Math.max(1, Math.floor(srcW * scale)), Math.max(1, Math.floor(srcH * scale))];
};

const computeNextDims = (
	width: number,
	height: number,
	ratio: number,
	minW: number,
	minH: number,
): [number, number] => {
	const clampedRatio = Math.min(ratio, 0.99);
	const nextW = Math.max(minW, Math.floor(width * clampedRatio));
	const nextH = Math.max(minH, Math.floor(height * clampedRatio));

	if (nextW === width && width > minW) {
		return [width - 1, nextH];
	}
	if (nextH === height && height > minH) {
		return [nextW, height - 1];
	}
	return [nextW, nextH];
};

const renderCanvas = (img: HTMLImageElement, w: number, h: number, crop: CropMode): OffscreenCanvas => {
	const canvas = new OffscreenCanvas(w, h);
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error(`failed to compress image, unable to create canvas`);
	}

	if (crop.type === Crop.COVER) {
		const [dx, dy, dw, dh] = cover(w, h, img.naturalWidth, img.naturalHeight);
		ctx.drawImage(img, dx, dy, dw, dh);
		return canvas;
	}

	ctx.drawImage(img, 0, 0, w, h);
	return canvas;
};
