import type {
	ActorIdentifier,
	CanonicalResourceUri,
	Did,
	Nsid,
	RecordKey,
	ResourceUri,
} from '@atcute/lexicons/syntax';

import { BSKY_SERVICE } from '#/lib/constants';

const BSKY_TRUSTED_HOSTS = new Set([
	'blueskyweb.xyz',
	'blueskyweb.zendesk.com',
	'bsky.app',
	'bsky.social',
	...(import.meta.env.DEV ? ['localhost:19006'] : []),
]);

/**
 * builds the at-uri for a record.
 *
 * @param repo the repo holding the record; a did yields a canonical uri, a handle a resolvable one
 * @param collection the record's collection nsid
 * @param rkey the record key
 * @returns the at-uri
 */
export function makeRecordUri(repo: Did, collection: Nsid, rkey: RecordKey): CanonicalResourceUri;
export function makeRecordUri(repo: ActorIdentifier, collection: Nsid, rkey: RecordKey): ResourceUri;
export function makeRecordUri(repo: ActorIdentifier, collection: Nsid, rkey: RecordKey): ResourceUri {
	return `at://${repo}/${collection}/${rkey}`;
}

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

/**
 * whether a link target is trusted, i.e. safe to navigate to without a leaving-the-app warning. relative
 * paths and in-app anchors are trusted; an absolute URL is trusted only when its host matches an entry in
 * {@link BSKY_TRUSTED_HOSTS} exactly.
 *
 * @param url the link target
 * @returns whether the target is trusted
 */
function isTrustedUrl(url: string): boolean {
	if (url.startsWith('/') || url.startsWith('#')) {
		return true;
	}
	const parsed = safeUrlParse(url);
	return parsed !== null && BSKY_TRUSTED_HOSTS.has(parsed.host);
}

const TRIM_HOST_RE = /^www\./;
const TRIM_URLTEXT_RE = /^\s*(?:https?:\/\/)?(?:www\.)?/i;

/**
 * builds the host string a faithful display text must begin with: the hostname (sans `www.`) plus an explicit
 * port.
 *
 * @param url the parsed link target
 * @returns the expected host string
 */
const buildExpectedHost = (url: URL): string => {
	const hostname = url.hostname.replace(TRIM_HOST_RE, '').toLowerCase();
	const host = url.port ? `${hostname}:${url.port}` : hostname;
	return url.username ? `\0@@\0${host}` : host;
};

/**
 * returns whether a link's visible text honestly represents its destination host.
 *
 * @param uri the link target
 * @param displayText the link's visible text
 * @returns true if the text faithfully represents the target host
 */
const linkTextMatchesHost = (uri: string, displayText: string): boolean => {
	const url = safeUrlParse(uri);
	if (url === null) {
		return false;
	}
	const expectedHost = buildExpectedHost(url);
	const normalized = displayText.replace(TRIM_URLTEXT_RE, '').toLowerCase();
	const boundary = normalized[expectedHost.length];
	return (
		(boundary === undefined || boundary === '/' || boundary === '?' || boundary === '#') &&
		normalized.startsWith(expectedHost)
	);
};

/**
 * determines if a link should show a warning before navigating. trusted targets (relative paths and anchors)
 * never warn; other targets warn unless the display text matches the destination host.
 *
 * @param uri the link target
 * @param displayText the link's visible text
 * @returns whether to show the leaving-the-app warning
 */
export const isMisleadingLink = (uri: string, displayText: string): boolean => {
	if (linkTextMatchesHost(uri, displayText)) {
		return false;
	}
	return !isTrustedUrl(uri);
};

/**
 * splits a hostname into its subdomain prefix and registrable apex domain (e.g., `a.b.example.co.uk` ->
 * `['a.b.', 'example.co.uk']`). returns `['', hostname]` if the hostname has no recognized ICANN public
 * suffix.
 *
 * @param hostname hostname to split
 * @returns a `[subdomainPrefix, apexDomain]` tuple
 */
export async function splitApexDomain(hostname: string): Promise<[string, string]> {
	const { parse } = await import('tldts');
	const parsed = parse(hostname);
	if (!parsed.domain || !parsed.isIcann) {
		return ['', hostname];
	}
	return [parsed.subdomain ? `${parsed.subdomain}.` : '', parsed.domain];
}

function getHostnameFromUrl(url: string | URL): string | null {
	let urlp;
	try {
		urlp = new URL(url);
	} catch {
		return null;
	}
	return urlp.hostname;
}

export function getServiceAuthAudFromUrl(url: string | URL): Did | null {
	const hostname = getHostnameFromUrl(url);
	if (!hostname) {
		return null;
	}
	return `did:web:${hostname}`;
}

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
 * parses a string into a URL, accepting only safe http(s) schemes.
 *
 * @param text the URL string to parse
 * @returns the parsed URL, or null if invalid or unsafe
 */
export const safeUrlParse = (text: string): URL | null => {
	const url = URL.parse(text);
	return url !== null && (url.protocol === 'http:' || url.protocol === 'https:') ? url : null;
};
