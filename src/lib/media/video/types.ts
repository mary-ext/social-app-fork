/** source attachment kind, preserved after transcoding. still GIFs are image attachments, not video assets. */
export type VideoAssetKind = 'gif' | 'video';

/** a selected video ready for upload. */
export type VideoAsset = {
	kind: VideoAssetKind;
	blob: Blob;
	width: number;
	height: number;
	mimeType: string;
	/** duration in milliseconds, or null when it could not be determined */
	duration: number | null;
};

/**
 * classifies a video attachment by its original MIME type. callers must exclude still GIFs first.
 *
 * @param mimeType source MIME type before transcoding
 * @returns source attachment kind
 */
export function videoAssetKind(mimeType: string): VideoAssetKind {
	return mimeType === 'image/gif' ? 'gif' : 'video';
}
