const EXTENSION = 0x21;
const IMAGE_DESCRIPTOR = 0x2c;
const TRAILER = 0x3b;
const GRAPHIC_CONTROL_LABEL = 0xf9;

/** browser-compatible replacement for frame delays of 0–1 centiseconds, in microseconds. */
export const CLAMPED_GIF_DELAY_US = 100_000;

const CLAMPED_DELAY_CS = CLAMPED_GIF_DELAY_US / 10_000;

export interface GifMetadata {
	isGif: boolean;
	/** number of image frames; a GIF is animated when it has more than one. */
	frames: number;
	/** total playback duration in microseconds. */
	durationUs: number;
}

/** colour table size in bytes, or 0 if absent. */
const colorTableBytes = (packed: number): number => (packed & 0x80 ? 3 * (1 << ((packed & 0x07) + 1)) : 0);

/**
 * reads GIF frame count and duration without decoding frames.
 *
 * @param bytes the complete file
 * @returns metadata with clamped frame delays; zero frames and duration if the header check fails
 */
export function readGifMetadata(bytes: Uint8Array): GifMetadata {
	// 6-byte signature, then the 7-byte logical screen descriptor.
	if (bytes.length < 13 || bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) {
		return { isGif: false, frames: 0, durationUs: 0 };
	}

	let pos = 13;
	pos += colorTableBytes(bytes[10] ?? 0);

	let frames = 0;
	let totalCs = 0;

	// sub-blocks run until a zero-length one terminates the chain.
	const skipSubBlocks = () => {
		while (pos < bytes.length) {
			const size = bytes[pos++] ?? 0;
			if (size === 0) {
				return;
			}
			pos += size;
		}
	};

	while (pos < bytes.length) {
		const block = bytes[pos++] ?? TRAILER;

		if (block === EXTENSION) {
			const label = bytes[pos++] ?? 0;
			if (label === GRAPHIC_CONTROL_LABEL) {
				const size = bytes[pos++] ?? 0;
				// packed field, then the delay in hundredths of a second, little-endian.
				const delayCs = (bytes[pos + 1] ?? 0) | ((bytes[pos + 2] ?? 0) << 8);
				totalCs += delayCs <= 1 ? CLAMPED_DELAY_CS : delayCs;
				pos += size;
			}
			skipSubBlocks();
		} else if (block === IMAGE_DESCRIPTOR) {
			frames++;
			// position and size, then the packed field declaring any local colour table.
			pos += 8;
			const packed = bytes[pos++] ?? 0;
			pos += colorTableBytes(packed);
			// LZW minimum code size, then the image data itself.
			pos += 1;
			skipSubBlocks();
		} else {
			break;
		}
	}

	return { isGif: true, frames, durationUs: totalCs * 10_000 };
}
