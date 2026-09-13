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
