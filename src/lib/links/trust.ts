import { safeUrlParse } from '#/lib/utils/url';

const BSKY_TRUSTED_HOSTS = new Set([
	'blueskyweb.xyz',
	'blueskyweb.zendesk.com',
	'bsky.app',
	'bsky.social',
	...(import.meta.env.DEV ? ['localhost:19006'] : []),
]);

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
