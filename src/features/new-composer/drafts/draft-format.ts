import type { AppBskyDraftDefs } from '@atcute/bluesky';
import type { GenericUri } from '@atcute/lexicons';

import {
	klipyHostname,
	parseDimensions,
	stripGifUrlParams,
	tenorHostname,
	toGifEmbedUrl,
} from '#/lib/media/external-gif/embed';
import type { Gif } from '#/lib/media/external-gif/types';
import { safeUrlParse } from '#/lib/utils/url';

import { getDeviceId } from '#/state/preferences/device-id';

const GIF_ALT_PARAM = 'alt';

export const WEB_DEVICE_NAME = 'Web';

// some clients store a platform name instead of a device name.
const GENERIC_DEVICE_NAMES = new Set(['Android', 'iOS', WEB_DEVICE_NAME]);

/**
 * checks whether a draft's attachments could be stored on this device.
 *
 * @param draft the draft
 * @returns true if deviceId is absent or matches this device
 */
export const isDraftFromThisDevice = (draft: AppBskyDraftDefs.Draft): boolean => {
	return draft.deviceId === undefined || draft.deviceId === getDeviceId();
};

/**
 * reads the name of the device that saved a draft.
 *
 * @param draft the draft
 * @returns the device name, or undefined if absent or only a platform name
 */
export const getDraftDeviceName = (draft: AppBskyDraftDefs.Draft): string | undefined => {
	const { deviceName } = draft;
	return deviceName !== undefined && !GENERIC_DEVICE_NAMES.has(deviceName) ? deviceName : undefined;
};

/**
 * lists a post's images.
 *
 * @param post the draft post
 * @returns the images, in order
 */
export const getDraftPostImages = (post: AppBskyDraftDefs.DraftPost): AppBskyDraftDefs.DraftEmbedImage[] => {
	// prefer galleries over the legacy four-image field.
	return post.embedGallery?.items ?? post.embedImages ?? [];
};

/**
 * lists the localRef paths of a draft's attachments.
 *
 * @param draft the draft
 * @returns the paths, in post order
 */
export const getDraftMediaPaths = (draft: AppBskyDraftDefs.Draft): string[] => {
	return draft.posts.flatMap((post) => {
		return [...getDraftPostImages(post), ...(post.embedVideos ?? [])].map((media) => media.localRef.path);
	});
};

/**
 * reads the file name of a localRef path, `<kind>:[<mime>:]<uuid>`.
 *
 * @param path the localRef path
 * @returns the last segment of the path
 */
export const getDraftMediaName = (path: string): string => {
	return path.slice(path.lastIndexOf(':') + 1);
};

/**
 * reads the MIME type of a video's localRef path, `video:<mime>:<uuid>`.
 *
 * @param path the localRef path
 * @returns the MIME type; `video/mp4` for legacy `video:<uuid>` paths
 */
export const getDraftVideoType = (path: string): string => {
	const [, type, rest] = path.split(':');
	return rest !== undefined && type?.includes('/') ? type : 'video/mp4';
};

/**
 * creates a unique image localRef path.
 *
 * @returns `image:<uuid>`
 */
export const createDraftImagePath = (): string => {
	return `image:${crypto.randomUUID()}`;
};

/**
 * creates a unique localRef path for a video or local GIF.
 *
 * @param type the file's MIME type
 * @returns `video:<mime>:<uuid>`
 */
export const createDraftVideoPath = (type: string): string => {
	return `video:${type}:${crypto.randomUUID()}`;
};

/**
 * encodes an external GIF and its alt text as a draft link.
 *
 * @param gif the GIF
 * @param alt the GIF's alt text; empty omits it
 * @returns the GIF's embed URL with its alt text
 */
export const toDraftGifUri = (gif: Gif, alt: string): GenericUri => {
	const url = new URL(toGifEmbedUrl(gif));
	if (alt) {
		url.searchParams.set(GIF_ALT_PARAM, alt);
	}

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `URL.toString()` always serializes an absolute url
	return url.toString() as GenericUri;
};

/**
 * reads an external GIF from a draft's link.
 *
 * @param uri the link's URI
 * @returns a Tenor or Klipy GIF with alt text, or undefined for unsupported URLs or invalid dimensions
 */
export const parseDraftGif = (uri: string): Gif | undefined => {
	const url = safeUrlParse(uri);
	if (url === null || (url.hostname !== tenorHostname && url.hostname !== klipyHostname)) {
		return undefined;
	}

	const dimensions = parseDimensions(url);
	if (!dimensions) {
		return undefined;
	}

	const alt = url.searchParams.get(GIF_ALT_PARAM) ?? '';

	const base = stripGifUrlParams(url);
	base.searchParams.delete(GIF_ALT_PARAM);
	const src = base.toString();

	const format = {
		url: src,
		dims: [dimensions.width, dimensions.height] satisfies [number, number],
		duration: 0,
		size: 0,
	};
	return {
		id: '',
		created: 0,
		hasaudio: false,
		hascaption: false,
		flags: '',
		tags: [],
		title: '',
		content_description: alt,
		itemurl: '',
		url: src,
		media_formats: { gif: format, preview: format, tinygif: format },
	};
};
