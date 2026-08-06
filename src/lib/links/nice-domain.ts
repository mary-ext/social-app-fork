import { BSKY_SERVICE } from '#/lib/constants';

/**
 * renders a URL's host for display, naming the Bluesky service instead of showing its hostname.
 *
 * @param url the URL to describe
 * @returns the host, or the input unchanged when it does not parse
 */
export function toNiceDomain(url: string): string {
	try {
		const urlp = new URL(url);
		if (`https://${urlp.host}` === BSKY_SERVICE) {
			return 'Bluesky Social';
		}
		return urlp.host ? urlp.host : url;
	} catch {
		return url;
	}
}
