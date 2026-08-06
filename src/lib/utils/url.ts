/**
 * parses a string into a URL, accepting only safe http(s) schemes.
 *
 * @param text the URL string to parse
 * @returns the parsed URL, or null if invalid or unsafe
 */
export const safeUrlParse = (text: string): URL | null => {
	const url = URL.parse(text);
	return url !== null && (url.protocol === 'http:' || url.protocol === 'https:') ? url : null;
};

/**
 * parses a string into a URL, accepting only HTTP(S) URLs with a genuine dotted host.
 *
 * @param text the URL string to parse
 * @returns the parsed URL, or null if invalid or lacking a real host
 */
export const parseLinkableUrl = (text: string): URL | null => {
	const url = safeUrlParse(text);
	if (url === null || !url.hostname.includes('.') || url.hostname.endsWith('.')) {
		return null;
	}
	return url;
};

/**
 * parses a user-entered URL, assuming https when no scheme is given.
 *
 * @param text the user-entered URL
 * @returns the normalized URL string, or null if the input is not a usable URL
 */
export const parseLooseUrl = (text: string): string | null => {
	const trimmed = text.trim();
	const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	return parseLinkableUrl(candidate)?.href ?? null;
};

export function toShortUrl(url: string): string {
	try {
		const urlp = new URL(url);
		if (urlp.protocol !== 'http:' && urlp.protocol !== 'https:') {
			return url;
		}
		const path = (urlp.pathname === '/' ? '' : urlp.pathname) + urlp.search + urlp.hash;
		if (path.length > 15) {
			return urlp.host + path.slice(0, 13) + '...';
		}
		return urlp.host + path;
	} catch {
		return url;
	}
}
