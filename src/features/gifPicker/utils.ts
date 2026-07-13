import { logger } from '#/logger';

/**
 * Rewrites a provider's CDN URL (Tenor or Klipy) to the corresponding bsky proxy hostname. Leaves
 * unrecognized hosts untouched.
 */
export function gifPreviewUrl(gifUrl: string) {
	try {
		const url = new URL(gifUrl);
		if (url.hostname === 'media.tenor.com') {
			url.hostname = 't.gifs.bsky.app';
			return url.href;
		}
		if (url.hostname === 'static.klipy.com') {
			url.hostname = 'k.gifs.bsky.app';
			return url.href;
		}
		return gifUrl;
	} catch {
		logger.debug('invalid url passed to gifPreviewUrl()');
		return '';
	}
}
