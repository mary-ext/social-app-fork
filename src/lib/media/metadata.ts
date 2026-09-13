export interface Dimensions {
	width: number;
	height: number;
}

import { getImageFromBlob } from './compress-image';

type VideoMetadata = Dimensions & {
	/** duration in milliseconds, or null when it could not be determined */
	duration: number | null;
};

/**
 * Reads the pixel dimensions of an image blob.
 *
 * @param blob image blob
 * @returns the image's width and height in pixels
 * @throws if the blob could not be loaded as an image
 */
export async function getImageDimensions(blob: Blob): Promise<Dimensions> {
	const image = await getImageFromBlob(blob);
	return { width: image.naturalWidth, height: image.naturalHeight };
}

const readMediaMetadata = <E extends HTMLMediaElement, T>(
	element: E,
	blob: Blob,
	read: (element: E) => T,
): Promise<T> => {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);

		element.preload = 'metadata';
		element.addEventListener(
			'loadedmetadata',
			() => {
				URL.revokeObjectURL(url);
				resolve(read(element));
			},
			{ once: true },
		);
		element.addEventListener(
			'error',
			() => {
				URL.revokeObjectURL(url);
				reject(new Error(`failed to load media metadata`));
			},
			{ once: true },
		);
		element.src = url;
	});
};

const durationOf = (element: HTMLMediaElement): number | null => {
	return Number.isFinite(element.duration) ? element.duration * 1000 : null;
};

/**
 * reads a video blob's dimensions and duration.
 *
 * @param blob video blob
 * @returns dimensions in pixels and duration in milliseconds (`null` if unknown)
 * @throws if the blob's metadata could not be loaded
 */
export function getVideoMetadata(blob: Blob): Promise<VideoMetadata> {
	return readMediaMetadata(document.createElement('video'), blob, (video) => ({
		width: video.videoWidth,
		height: video.videoHeight,
		duration: durationOf(video),
	}));
}
