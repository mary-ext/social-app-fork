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

/**
 * gemma 4's vision encoder splits an image into 16px patches and pools them 3×3, so it only ever sees whole
 * 48px blocks. sizing to a multiple of this means its own aspect-preserving resize lands back on the
 * dimensions we sent, leaving our downscale as the only resample the pixels go through.
 */
const VISION_BLOCK = 48;

/**
 * the encoder caps a single image at 1120 pooled tokens, one per 48px block, so pixels past this are
 * discarded before the model ever sees them. sized to the largest budget on offer because alt text leans on
 * transcribing text in the image, which is where resolution actually pays.
 */
const VISION_MAX_PIXELS = 1120 * VISION_BLOCK * VISION_BLOCK;

/** how far snapping to whole blocks may bend the aspect ratio before it stops being worth the alignment. */
const MAX_ASPECT_DRIFT = 0.03;

// #endregion

const QUALITY_STEPS = [92, 88, 84, 80] as const;
const MAX_QUALITY = QUALITY_STEPS[0];

// #region prediction table

// leave 8% room for per-image deviation from the population median; baseline R² of
// `anchorBytes × ratio` vs actual is 0.94–0.99 across cells, so this covers the p95
// error at every reasonable cell.
const PREDICTION_HEADROOM = 0.92;

const PREDICTION_SCALES = [1.0, 0.9, 0.8, 0.7, 0.6] as const;

/**
 * median encoded-bytes ratios vs the anchor (scale=1.0, q=92), measured via chromium's WebP encoder on 64
 * test images. rows correspond to {@link PREDICTION_SCALES}, columns to {@link QUALITY_STEPS}.
 */
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
// once dimensions have already dropped somewhat, start trading off quality too
const SOFT_MIN_SCALE = 0.8;
// don't shrink below roughly three-fifths of the fitted dimensions unless we have no other choice
const HARD_MIN_SCALE = 0.6;
// aim slightly under the byte budget so a small prediction error doesn't bounce us back over
const TARGET_HEADROOM = 0.95;

// #endregion

const enum Crop {
	CONTAIN,
	COVER,
}

/**
 * how the output dimensions are chosen. `maxPixels` rides on the CONTAIN variant because it only means
 * anything when the aspect ratio is being preserved — a COVER caller is dictating exact dimensions.
 */
type CropMode =
	| {
			type: Crop.CONTAIN;
			/**
			 * if set, an additional cap on total output pixels, snapped down to whole {@link VISION_BLOCK} blocks.
			 * a bounding box wastes most of the budget on a panorama; an area cap spends all of it.
			 */
			maxPixels?: number;
	  }
	| { type: Crop.COVER };

interface CompressOptions {
	maxBytes: number;
	maxWidth: number;
	maxHeight: number;
	type: 'image/webp' | 'image/jpeg';
	crop: CropMode;
	/**
	 * if set, source blobs whose mime type is in this list may skip re-encoding when already under the byte
	 * budget
	 */
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
 * re-encode an image for the alt text description endpoint, sized to what the model's vision encoder can
 * actually resolve. deliberately not the post encode: that one is sized for display and is several times
 * larger than anything the encoder keeps.
 *
 * @param blob source image
 * @returns the encoded blob and its final aspect ratio
 * @throws if no attempt produces a blob within the byte budget
 */
export const compressAltTextImage = (blob: Blob): Promise<CompressResult> => {
	return compressImage(blob, {
		type: 'image/webp',
		maxBytes: ALT_TEXT_MAX_BYTES,
		// no bounding box: the pixel budget is the real cap, and a box binding first would leave most of that
		// budget unspent on anything far from square
		maxHeight: Infinity,
		maxWidth: Infinity,
		// a source that already fits is passed through untouched, so only encodings the endpoint accepts may
		// skip the re-encode — otherwise the caller would be handed, say, an avif to label as webp
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

/**
 * compress an image to fit a byte budget.
 *
 * @param blob source image
 * @param opts size, format, and crop policy
 * @returns the encoded blob and its final aspect ratio
 * @throws if no attempt produces a blob within the byte budget
 */
const compressImageUncapped = async (blob: Blob, opts: CompressOptions): Promise<CompressResult> => {
	// strip exif first — may bring an oversized source under budget
	blob = await stripExif(blob);

	const image = await getImageFromBlob(blob);

	// fast path: source already fits — keep the original encoding rather than re-encoding losslessly to a worse format
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

	// anchor encode: full fitted dims at max quality. often fits directly, and supplies the
	// per-image byte count used by the predictor and iterative fallback.
	const anchorBlob = await encodeAt(image, fittedW, fittedH, MAX_QUALITY, opts);
	if (anchorBlob.size <= opts.maxBytes) {
		return { blob: anchorBlob, aspectRatio: { width: fittedW, height: fittedH } };
	}

	let result: CompressResult | undefined;

	// table-based prediction is only validated for webp CONTAIN
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
 * encodes the image at the highest-scoring cell that is predicted to fit the byte budget.
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
			// weight pixels and quality equally — a 0.1 scale step trades against a ~9-point quality step
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
 * search for an encode within budget by iteratively shrinking scale and reducing quality.
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

	// attempt 0 is the anchor; the loop runs up to MAX_ATTEMPTS - 1 additional encodes.
	for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
		if (encoded.size <= opts.maxBytes) {
			return { blob: encoded, aspectRatio: { width, height } };
		}

		// overshoot: encoded byte count scales roughly with pixel count, so derive the next
		// linear scale from sqrt(target / actual). converges quickly for well-behaved images.
		const ratio = Math.sqrt((opts.maxBytes * TARGET_HEADROOM) / encoded.size);
		const canLowerQuality = qualityIndex < QUALITY_STEPS.length - 1;
		const hitSoftMin = width <= softMinW || height <= softMinH;
		const hitHardMin = width <= hardMinW || height <= hardMinH;

		if (canLowerQuality && hitSoftMin) {
			qualityIndex += 1;
		} else if (hitHardMin) {
			// at hard min with no quality headroom left — we've exhausted the search space
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
 * remove EXIF metadata from a supported image blob. returns the original blob unchanged if the format isn't
 * recognized by the exif stripper.
 *
 * @param blob source image
 * @returns a blob with EXIF removed, or the original blob if no stripping was applied
 */
export const stripExif = async (blob: Blob): Promise<Blob> => {
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

/**
 * whether the source is larger than the output budget allows, by either measure. the byte-budget fast path
 * hands the source back untouched, so without this a cheap-to-encode image sails through at whatever
 * dimensions it arrived with — which defeats a bounding box as surely as it defeats a pixel budget. cover
 * callers dictate exact dimensions, so there is no budget of their own to exceed.
 */
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

	// only snap while shrinking: on a source already under budget the blocks would cost resolution and buy
	// nothing, since the encoder scales it up to meet its budget either way
	if (crop.maxPixels !== undefined && scale < 1) {
		const idealW = srcW * scale;
		const idealH = srcH * scale;
		const width = Math.floor(idealW / VISION_BLOCK) * VISION_BLOCK;
		const height = Math.floor(idealH / VISION_BLOCK) * VISION_BLOCK;

		// flooring costs each side under one block, which on a normal photo is a rounding detail — but on a
		// side only a few blocks long it squashes the image outright, and a squashed image describes worse
		// than a resampled one
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
