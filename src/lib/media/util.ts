export function isUriImage(uri: string): boolean {
	return /\.(jpg|jpeg|png|webp).*$/.test(uri);
}

export type ImgproxyPreset =
	| 'default'
	| 'avatar_thumbnail'
	| 'avatar'
	| 'banner'
	| 'feed_fullsize'
	| 'feed_thumbnail'
	| 'download';

// Using capturing groups here instead of lookbehinds in order to support older versions of Safari.
// https://bugs.webkit.org/show_bug.cgi?id=174931
const IMGPROXY_PRESET_RE =
	/(\/img\/)(default|avatar_thumbnail|avatar|banner|feed_fullsize|feed_thumbnail|download)(\/)/;

/** Replaces any imgproxy preset in a CDN URI with the given preset. */
export function convertCdnPreset(uri: string, preset: ImgproxyPreset): string {
	return uri.replace(IMGPROXY_PRESET_RE, `$1${preset}$3`);
}
