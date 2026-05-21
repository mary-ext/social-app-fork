import { type Dimensions } from './types';

export type VideoMetadata = Dimensions & {
	/** duration in milliseconds, or null when it could not be determined */
	duration: number | null;
};

/**
 * Reads the pixel dimensions of an image blob.
 *
 * @param blob image blob
 * @returns the image's width and height in pixels
 * @throws if the blob could not be decoded as an image
 */
export async function getImageDimensions(blob: Blob): Promise<Dimensions> {
	const url = URL.createObjectURL(blob);
	const image = new Image();
	image.src = url;

	try {
		await image.decode();
	} finally {
		URL.revokeObjectURL(url);
	}

	return { width: image.naturalWidth, height: image.naturalHeight };
}

/**
 * Reads the dimensions and duration of a video blob.
 *
 * @param blob video blob
 * @returns the video's dimensions and duration
 * @throws if the blob's metadata could not be loaded
 */
export function getVideoMetadata(blob: Blob): Promise<VideoMetadata> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const video = document.createElement('video');

		video.preload = 'metadata';
		video.onloadedmetadata = () => {
			URL.revokeObjectURL(url);
			resolve({
				width: video.videoWidth,
				height: video.videoHeight,
				duration: Number.isFinite(video.duration) ? video.duration * 1000 : null,
			});
		};
		video.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load video metadata'));
		};
		video.src = url;
	});
}
