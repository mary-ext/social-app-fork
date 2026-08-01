import type { AppLink } from '#/lib/links/app-url';

// short-link codes are opaque; validate only the path shape here.
const SHORT_CODE_RE = /^\/([a-zA-Z0-9]+)\/?$/;

/**
 * parses a `go.bsky.app` path.
 *
 * @param url the URL to parse
 * @returns the short-link target, or undefined for an invalid path
 */
export const parseBlueskyShortPath = (url: URL): AppLink | undefined => {
	const match = SHORT_CODE_RE.exec(url.pathname);
	if (!match) {
		return undefined;
	}

	const [, code] = match;
	return code ? { kind: 'bsky-starter-pack-code', code } : undefined;
};
