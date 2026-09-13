/** RGB channels in the range 0–255. */
export type Rgb = {
	r: number;
	g: number;
	b: number;
};

const FALLBACK_BACKGROUND: Rgb = { r: 34, g: 138, b: 199 };

// downsample to limit quantization cost.
const SAMPLE_SIZE = 64;

const SWATCH_COUNT = 16;

// exclude highlights to keep the white overlay legible.
const MAX_LIGHTNESS = 0.75;

// HSL targets, 0–1.
const TARGET_SATURATION = 0.7;

const TARGET_LIGHTNESS = 0.4;

// let small, vivid clusters outweigh larger dull ones.
const POPULATION_WEIGHT = 0.4;

// ignore mostly transparent pixels.
const MIN_ALPHA = 128;

type Pixel = [r: number, g: number, b: number];

type Swatch = {
	rgb: Pixel;
	count: number;
	saturation: number;
	lightness: number;
};

/**
 * formats an RGB color for CSS or canvas.
 *
 * @param color 8-bit RGB channels
 * @returns a CSS `rgb()` value
 */
export const toCssColor = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

const saturationAndLightness = ([r, g, b]: Pixel): [saturation: number, lightness: number] => {
	const max = Math.max(r, g, b) / 255;
	const min = Math.min(r, g, b) / 255;
	const lightness = (max + min) / 2;
	if (max === min) {
		return [0, lightness];
	}
	const delta = max - min;
	return [lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min), lightness];
};

const readPixels = (image: ImageBitmap): Pixel[] => {
	const canvas = new OffscreenCanvas(SAMPLE_SIZE, SAMPLE_SIZE);
	const context = canvas.getContext('2d', { willReadFrequently: true });
	if (!context) {
		throw new Error(`couldn't acquire a 2D context for color sampling`);
	}
	context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

	const data = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
	const pixels: Pixel[] = [];
	for (let index = 0; index < data.length; index += 4) {
		if (data[index + 3]! >= MIN_ALPHA) {
			pixels.push([data[index]!, data[index + 1]!, data[index + 2]!]);
		}
	}
	return pixels;
};

const channelRange = (box: Pixel[], channel: 0 | 1 | 2): number => {
	let min = 255;
	let max = 0;
	for (const pixel of box) {
		min = Math.min(min, pixel[channel]);
		max = Math.max(max, pixel[channel]);
	}
	return max - min;
};

// median-cut quantization: split the cluster with the widest channel range at its median.
const medianCut = (pixels: Pixel[]): Swatch[] => {
	let boxes = [pixels];
	while (boxes.length < SWATCH_COUNT) {
		let widestBox = -1;
		let widestChannel: 0 | 1 | 2 = 0;
		let widestRange = 0;
		for (const [index, box] of boxes.entries()) {
			if (box.length < 2) {
				continue;
			}
			for (const channel of [0, 1, 2] as const) {
				const range = channelRange(box, channel);
				if (range > widestRange) {
					widestRange = range;
					widestBox = index;
					widestChannel = channel;
				}
			}
		}
		if (widestBox < 0) {
			break;
		}

		const sorted = boxes[widestBox]!.toSorted((a, b) => a[widestChannel] - b[widestChannel]);
		const middle = sorted.length >> 1;
		boxes = boxes
			.filter((_, index) => index !== widestBox)
			.concat([sorted.slice(0, middle), sorted.slice(middle)]);
	}

	return boxes.map((box) => {
		let r = 0;
		let g = 0;
		let b = 0;
		for (const pixel of box) {
			r += pixel[0];
			g += pixel[1];
			b += pixel[2];
		}

		const rgb: Pixel = [r / box.length, g / box.length, b / box.length];
		const [saturation, lightness] = saturationAndLightness(rgb);
		return { rgb, count: box.length, saturation, lightness };
	});
};

/**
 * selects an avatar-derived background, favoring vivid colors over large clusters.
 *
 * @param image canvas-safe avatar bitmap
 * @returns the chosen color, or fallback blue if no usable swatch remains
 * @throws if canvas pixel access fails
 */
export const dominantColor = (image: ImageBitmap): Rgb => {
	const pixels = readPixels(image);
	if (pixels.length === 0) {
		return FALLBACK_BACKGROUND;
	}

	const swatches = medianCut(pixels);
	const largest = Math.max(...swatches.map((swatch) => swatch.count));

	let winner: { score: number; rgb: Pixel } | null = null;
	for (const swatch of swatches) {
		// no lower cutoff: near-black backgrounds are acceptable.
		if (swatch.lightness >= MAX_LIGHTNESS) {
			continue;
		}

		const score =
			-Math.abs(swatch.saturation - TARGET_SATURATION) -
			Math.abs(swatch.lightness - TARGET_LIGHTNESS) +
			POPULATION_WEIGHT * (swatch.count / largest);

		if (!winner || score > winner.score) {
			winner = { score, rgb: swatch.rgb };
		}
	}

	if (!winner) {
		return FALLBACK_BACKGROUND;
	}

	const [r, g, b] = winner.rgb;
	return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
};
