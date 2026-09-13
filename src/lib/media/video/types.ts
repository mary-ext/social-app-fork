/** source attachment kind, preserved after transcoding. still GIFs are image attachments, not video assets. */
export type VideoAssetKind = 'gif' | 'video';

/** source video before transcoding */
export type VideoAsset = {
	kind: VideoAssetKind;
	blob: Blob;
	width: number;
	height: number;
	mimeType: string;
	/** duration in milliseconds, or null when it could not be determined */
	duration: number | null;
};

/** upload file and metadata, after any transcoding or rendering */
export type VideoPayload = {
	blob: Blob;
	width: number;
	height: number;
	mimeType: string;
	/** duration in milliseconds, or null if unknown */
	duration: number | null;
};

/**
 * uses the source file unchanged as an upload payload.
 *
 * @param asset source video
 * @returns source file and metadata
 */
export const toVideoPayload = ({ blob, width, height, mimeType, duration }: VideoAsset): VideoPayload => ({
	blob,
	width,
	height,
	mimeType,
	duration,
});
