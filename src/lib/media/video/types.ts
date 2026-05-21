/** A video selected by the user, before compression. */
export type VideoAsset = {
	blob: Blob;
	width: number;
	height: number;
	mimeType: string;
	/** duration in milliseconds, or null when it could not be determined */
	duration: number | null;
};

export type CompressedVideo = {
	blob: Blob;
	mimeType: string;
};
