import type { AppBskyEmbedVideo } from '@atcute/bluesky';

import { VIDEO_CDN_SERVICE, VIDEO_SERVICE } from '#/lib/constants';

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

/**
 * re-points an image CDN url at a different imgproxy preset, i.e. a different rendition of the same image.
 *
 * @param uri the image CDN url
 * @param preset the rendition to request
 * @returns the url at that preset, or the unchanged url when it names no preset
 */
export function toImageCdnUrl(uri: string, preset: ImgproxyPreset): string {
	return uri.replace(IMGPROXY_PRESET_RE, `$1${preset}$3`);
}

const WATCH_PREFIX = `${VIDEO_SERVICE}/watch/`;
const CDN_PREFIX = `${VIDEO_CDN_SERVICE}/hls/`;

/**
 * re-points a video service url at the CDN.
 *
 * @param url the video service url
 * @returns the CDN url without `session_id`, or the unchanged url for other services
 */
export const toVideoCdnUrl = (url: string) => {
	if (!url.startsWith(WATCH_PREFIX)) {
		return url;
	}
	const cdn = new URL(CDN_PREFIX + url.slice(WATCH_PREFIX.length));
	cdn.searchParams.delete('session_id');
	return cdn.href;
};

/**
 * the CDN poster url for a video embed.
 *
 * @param embed the video embed view
 * @returns the CDN poster url, or undefined when the embed carries no poster
 */
export const videoThumbnailUrl = (embed: AppBskyEmbedVideo.View) =>
	embed.thumbnail && toVideoCdnUrl(embed.thumbnail);
