import type { Gif } from './types';

export const klipyHostname = 'static.klipy.com';
export const tenorHostname = 'media.tenor.com';

const klipyProxyHostname = 'k.gifs.bsky.app';
const tenorProxyHostname = 't.gifs.bsky.app';

const gifUrlParams = {
	height: 'hh',
	width: 'ww',
	mp4: 'mp4',
	webm: 'webm',
};

export interface GifEmbedParams {
	dimensions: {
		height: number;
		width: number;
	};
	playerSources: ReadonlyArray<{ src: string; type: string }>;
}

/**
 * returns the proxy URL for a Klipy GIF URL.
 *
 * @param url GIF URL
 * @returns proxy URL, or `undefined` for a different host
 */
export const toProxiedGifUrl = (url: URL): string | undefined => {
	if (url.hostname !== klipyHostname) {
		return undefined;
	}

	const proxied = new URL(url.href);
	proxied.hostname = klipyProxyHostname;
	return proxied.href;
};

/**
 * removes app metadata from a GIF URL copy.
 *
 * @param url GIF URL
 * @returns URL without app metadata
 */
export const stripGifUrlParams = (url: URL): URL => {
	const stripped = new URL(url.href);
	for (const param of Object.values(gifUrlParams)) {
		stripped.searchParams.delete(param);
	}
	return stripped;
};

const parseTenorGif = (url: URL): GifEmbedParams | undefined => {
	if (url.hostname !== tenorHostname) {
		return undefined;
	}

	const [, id, filename] = url.pathname.split('/');

	if (!id || !filename) {
		return undefined;
	}

	if (!id.includes('AAAAC')) {
		return undefined;
	}

	const dimensions = parseDimensions(url);
	if (!dimensions) {
		return undefined;
	}

	// Tenor identifies each format with a path marker.
	const webmUrl = `https://${tenorProxyHostname}/${id.replace('AAAAC', 'AAAP3')}/${filename.replace('.gif', '.webm')}`;
	const mp4Url = `https://${tenorProxyHostname}/${id.replace('AAAAC', 'AAAP1')}/${filename.replace('.gif', '.mp4')}`;
	return {
		dimensions,
		playerSources: [
			{ src: webmUrl, type: 'video/webm' },
			{ src: mp4Url, type: 'video/mp4' },
		],
	};
};

const parseKlipyGif = (url: URL): GifEmbedParams | undefined => {
	if (url.hostname !== klipyHostname) {
		return undefined;
	}

	if (!url.pathname.startsWith('/ii/')) {
		return undefined;
	}

	const dimensions = parseDimensions(url);
	if (!dimensions) {
		return undefined;
	}

	const webmSlug = url.searchParams.get(gifUrlParams.webm);
	const mp4Slug = url.searchParams.get(gifUrlParams.mp4);

	if (!webmSlug && !mp4Slug) {
		return undefined;
	}

	const playerUrl = stripGifUrlParams(url);
	playerUrl.hostname = klipyProxyHostname;

	const buildVideoUrl = (slug: string, ext: string) => {
		const videoUrl = new URL(playerUrl.href);
		const parts = videoUrl.pathname.split('/');
		parts[parts.length - 1] = `${slug}.${ext}`;
		videoUrl.pathname = parts.join('/');
		return videoUrl.href;
	};

	const playerSources: { src: string; type: string }[] = [];
	if (webmSlug) {
		playerSources.push({ src: buildVideoUrl(webmSlug, 'webm'), type: 'video/webm' });
	}
	if (mp4Slug) {
		playerSources.push({ src: buildVideoUrl(mp4Slug, 'mp4'), type: 'video/mp4' });
	}

	return {
		dimensions,
		playerSources,
	};
};

/**
 * reads the dimensions embedded in a GIF URL's query parameters.
 *
 * @param url the GIF URL
 * @returns positive integer dimensions, or undefined if either is missing or invalid
 */
export const parseDimensions = (url: URL): { height: number; width: number } | undefined => {
	const hp = url.searchParams.get(gifUrlParams.height);
	const wp = url.searchParams.get(gifUrlParams.width);

	if (!hp || !wp) {
		return undefined;
	}

	const height = Number(hp);
	const width = Number(wp);

	if (!Number.isSafeInteger(height) || !Number.isSafeInteger(width) || height <= 0 || width <= 0) {
		return undefined;
	}

	return { height, width };
};

const getFileSlug = (url: string | undefined): string | undefined => {
	if (!url) {
		return undefined;
	}
	const filename = url.split('/').pop();
	if (!filename) {
		return undefined;
	}
	const dotIndex = filename.lastIndexOf('.');
	return dotIndex > 0 ? filename.slice(0, dotIndex) : undefined;
};

/**
 * builds a GIF embed URL for inline playback.
 *
 * @param gif GIF picker result
 * @returns GIF URL with dimensions and available Klipy video filenames
 */
export const toGifEmbedUrl = (gif: Gif): string => {
	const gifUrl = gif.media_formats.gif.url;
	const params = new URLSearchParams();
	params.set(gifUrlParams.height, String(gif.media_formats.gif.dims[1]));
	params.set(gifUrlParams.width, String(gif.media_formats.gif.dims[0]));

	// Klipy uses a different filename for each video format.
	try {
		const url = new URL(gifUrl);
		if (url.hostname === klipyHostname) {
			const mp4Slug = getFileSlug(gif.media_formats.mp4?.url);
			const webmSlug = getFileSlug(gif.media_formats.webm?.url);
			if (mp4Slug) {
				params.set(gifUrlParams.mp4, mp4Slug);
			}
			if (webmSlug) {
				params.set(gifUrlParams.webm, webmSlug);
			}
		}
	} catch {}

	return `${gifUrl}?${params.toString()}`;
};

/**
 * parses a supported GIF URL for inline playback.
 *
 * @param url GIF URL
 * @returns playback parameters, or `undefined` for an unsupported URL
 */
export const parseGifEmbedFromUrl = (url: string): GifEmbedParams | undefined => {
	let parsedUrl;
	try {
		parsedUrl = new URL(url);
	} catch {
		return undefined;
	}

	return parseTenorGif(parsedUrl) ?? parseKlipyGif(parsedUrl);
};

/**
 * tests whether a URL supports inline GIF playback.
 *
 * @param url GIF URL
 * @returns whether the URL is supported
 */
export const isGifEmbed = (url: string): boolean => parseGifEmbedFromUrl(url) !== undefined;
