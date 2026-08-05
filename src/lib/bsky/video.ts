import type { AppBskyEmbedVideo } from '@atcute/bluesky';

import { VIDEO_CDN_SERVICE, VIDEO_SERVICE } from '#/lib/constants';

const WATCH_PREFIX = `${VIDEO_SERVICE}/watch/`;
const CDN_PREFIX = `${VIDEO_CDN_SERVICE}/hls/`;

/**
 * converts a video service url to its CDN url.
 *
 * @param url video service url
 * @returns CDN url without `session_id`, or the unchanged url for other services
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
 * gets the CDN poster url for a video embed.
 *
 * @param embed video embed view
 * @returns CDN poster url, or undefined when no poster is present
 */
export const videoThumbnailUrl = (embed: AppBskyEmbedVideo.View) =>
	embed.thumbnail && toVideoCdnUrl(embed.thumbnail);
