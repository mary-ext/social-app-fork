declare const ManagedMediaSource: typeof MediaSource | undefined;

const pickMediaSource = () => {
	if (typeof ManagedMediaSource !== 'undefined') {
		return ManagedMediaSource;
	}
	if (typeof MediaSource !== 'undefined') {
		return MediaSource;
	}
	return undefined;
};

/** ManagedMediaSource or MediaSource; undefined if neither is available. */
export const MediaSourceClass = pickMediaSource();

/** @returns whether the browser supports the HLS player. */
export const isHlsPlayerSupported = () => MediaSourceClass !== undefined;

/**
 * checks whether Media Source Extensions accept a MIME type.
 *
 * @param mimeType MIME type to check
 * @returns whether the MIME type is supported
 */
export const canPlayMimeType = (mimeType: string) => MediaSourceClass?.isTypeSupported(mimeType) ?? false;
