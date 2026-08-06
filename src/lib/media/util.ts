export function isUriImage(uri: string): boolean {
	return /\.(jpg|jpeg|png|webp).*$/.test(uri);
}

type ImgproxyPreset =
	| 'default'
	| 'avatar_thumbnail'
	| 'avatar'
	| 'banner'
	| 'feed_fullsize'
	| 'feed_thumbnail'
	| 'download';

// use capturing groups for Safari compatibility.
const IMGPROXY_PRESET_RE =
	/(\/img\/)(default|avatar_thumbnail|avatar|banner|feed_fullsize|feed_thumbnail|download)(\/)/;

/** replaces the imgproxy preset in a CDN URI. */
export function convertCdnPreset(uri: string, preset: ImgproxyPreset): string {
	return uri.replace(IMGPROXY_PRESET_RE, `$1${preset}$3`);
}
