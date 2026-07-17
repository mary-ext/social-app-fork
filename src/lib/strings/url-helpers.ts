import {
	type ActorIdentifier,
	type Nsid,
	parseResourceUri,
	type RecordKey,
	type ResourceUri,
} from '@atcute/lexicons/syntax';

import { BSKY_SERVICE } from '#/lib/constants';
import { startUriToStarterPackUri } from '#/lib/strings/starter-pack';

const BSKY_APP_HOST = 'https://bsky.app';
const BSKY_TRUSTED_HOSTS = new Set([
	'blueskyweb.xyz',
	'blueskyweb.zendesk.com',
	'bsky.app',
	'bsky.social',
	...(import.meta.env.DEV ? ['localhost:19006', 'localhost:8100'] : []),
]);

export function makeRecordUri(didOrName: ActorIdentifier, collection: Nsid, rkey: RecordKey): ResourceUri {
	return `at://${didOrName}/${collection}/${rkey}`;
}

/**
 * extracts the branded actor and record key from a normalized bsky.app record path of the form
 * `/profile/{actor}/{collection}/{rkey}`, as produced by {@link convertBskyAppUrlIfNeeded}.
 *
 * the two segments are asserted, not runtime-validated: callers must have already matched the path with one
 * of the `isBsky*Url` guards, whose accepted shape guarantees these positions.
 *
 * @param path normalized bsky.app record path
 * @returns the actor identifier and record key from the path
 */
export function parseBskyRecordUrl(path: string): { actor: ActorIdentifier; rkey: RecordKey } {
	const [_0, actor, _1, rkey] = path.split('/').filter(Boolean) as [
		string,
		ActorIdentifier,
		string,
		RecordKey,
	];
	return { actor, rkey };
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

export function toShareUrl(url: string): string {
	if (!url.startsWith('https')) {
		const urlp = new URL('https://bsky.app');
		urlp.pathname = url;
		url = urlp.toString();
	}
	return url;
}

export function toBskyAppUrl(url: string): string {
	return new URL(url, BSKY_APP_HOST).toString();
}

export function isBskyAppUrl(url: string): boolean {
	return url.startsWith('https://bsky.app/');
}

export function isRelativeUrl(url: string): boolean {
	return /^\/[^/]/.test(url);
}

export function isExternalUrl(url: string): boolean {
	const external = !isBskyAppUrl(url) && url.startsWith('http');
	return external;
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

export function isBskyPostUrl(url: string): boolean {
	if (isBskyAppUrl(url)) {
		try {
			const urlp = new URL(url);
			return /profile\/(?<name>[^/]+)\/post\/(?<rkey>[^/]+)/i.test(urlp.pathname);
		} catch {}
	}
	return false;
}

export function isBskyCustomFeedUrl(url: string): boolean {
	if (isBskyAppUrl(url)) {
		try {
			const urlp = new URL(url);
			return /profile\/(?<name>[^/]+)\/feed\/(?<rkey>[^/]+)/i.test(urlp.pathname);
		} catch {}
	}
	return false;
}

export function isBskyListUrl(url: string): boolean {
	if (isBskyAppUrl(url)) {
		try {
			const urlp = new URL(url);
			return /profile\/(?<name>[^/]+)\/lists\/(?<rkey>[^/]+)/i.test(urlp.pathname);
		} catch {
			console.error('Unexpected error in isBskyListUrl()', url);
		}
	}
	return false;
}

export function isBskyStartUrl(url: string): boolean {
	if (isBskyAppUrl(url)) {
		try {
			const urlp = new URL(url);
			return /start\/(?<name>[^/]+)\/(?<rkey>[^/]+)/i.test(urlp.pathname);
		} catch {
			console.error('Unexpected error in isBskyStartUrl()', url);
		}
	}
	return false;
}

export function isBskyStarterPackUrl(url: string): boolean {
	if (isBskyAppUrl(url)) {
		try {
			const urlp = new URL(url);
			return /starter-pack\/(?<name>[^/]+)\/(?<rkey>[^/]+)/i.test(urlp.pathname);
		} catch {
			console.error('Unexpected error in isBskyStarterPackUrl()', url);
		}
	}
	return false;
}

// Invite codes are 7 alphanumeric characters long, supporting up to 10 here to future-proof.
const CHAT_INVITE_CODE_REGEX = /^\/chat\/([a-zA-Z0-9]{7,10})$/;

export function getChatInviteCodeFromUrl(url: string): string | undefined {
	let pathname: string;
	if (isBskyAppUrl(url)) {
		try {
			pathname = new URL(url).pathname;
		} catch {
			return undefined;
		}
	} else if (url.startsWith('/')) {
		pathname = url.split('?')[0]!.split('#')[0]!;
	} else {
		return undefined;
	}
	return pathname.match(CHAT_INVITE_CODE_REGEX)?.[1];
}

export function isBskyChatInviteUrl(url: string): boolean {
	return getChatInviteCodeFromUrl(url) !== undefined;
}

export function convertBskyAppUrlIfNeeded(url: string): string {
	if (isBskyAppUrl(url)) {
		try {
			const urlp = new URL(url);

			if (isBskyStartUrl(url)) {
				return startUriToStarterPackUri(urlp.pathname);
			}

			return urlp.pathname + urlp.search;
		} catch (e) {
			console.error('Unexpected error in convertBskyAppUrlIfNeeded()', e);
		}
	}
	return url;
}

export function listUriToHref(url: string): string {
	try {
		const { repo, rkey } = parseResourceUri(url);
		return `/profile/${repo}/lists/${rkey}`;
	} catch {
		return '';
	}
}

export function feedUriToHref(url: string): string {
	try {
		const { repo, rkey } = parseResourceUri(url);
		return `/profile/${repo}/feed/${rkey}`;
	} catch {
		return '';
	}
}

export function postUriToRelativePath(uri: string): string | undefined {
	try {
		const { repo, rkey } = parseResourceUri(uri);
		return `/profile/${repo}/post/${rkey}`;
	} catch {
		return undefined;
	}
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

export function isShortLink(url: string): boolean {
	return url.startsWith('https://go.bsky.app/');
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

export function getServiceAuthAudFromUrl(url: string | URL): string | null {
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
