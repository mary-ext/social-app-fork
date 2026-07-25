import type { ActorIdentifier, RecordKey } from '@atcute/lexicons/syntax';

import { parseBlueskyPath } from '#/lib/links/schemes/bluesky';
import { safeUrlParse } from '#/lib/strings/url-helpers';

/**
 * a destination named by a client's URL, in terms of the records behind it rather than any one app's paths.
 * `#/lib/routes/app-links` maps these onto this app's routes.
 */
export type AppLink =
	| { code: string; kind: 'chat-invite' }
	| { actor: ActorIdentifier; kind: 'feed'; rkey: RecordKey }
	| { author: ActorIdentifier | undefined; kind: 'hashtag'; tag: string }
	| { actor: ActorIdentifier; kind: 'list'; rkey: RecordKey }
	| { actor: ActorIdentifier; kind: 'post'; rkey: RecordKey }
	| { actor: ActorIdentifier; kind: 'profile' }
	| { kind: 'search'; query: string }
	| { actor: ActorIdentifier; kind: 'starter-pack'; rkey: RecordKey }
	| { kind: 'topic'; topic: string };

// #region scheme registry

/** a URL scheme belonging to some other client, and the hosts that serve it. */
export type LinkScheme = {
	/** hostnames serving this scheme, lowercase and without a port. */
	readonly hosts: ReadonlySet<string>;
	/** reads a path written in this scheme. */
	readonly parse: (url: URL) => AppLink | undefined;
};

const SCHEMES: readonly LinkScheme[] = [
	{
		hosts: new Set(['bsky.app', 'deer.social', 'main.bsky.dev', 'witchsky.app', 'zeppelin.social']),
		parse: parseBlueskyPath,
	},
];

const schemeFor = (url: URL): LinkScheme | undefined => {
	return SCHEMES.find((scheme) => scheme.hosts.has(url.hostname));
};

const isOwnUrl = (url: URL): boolean => {
	return url.hostname === location.hostname;
};

// #endregion

// #region url description

/**
 * a URL this app can open, and what it names. our own URLs are already in-app paths, so `own` carries the
 * path verbatim, and `link` is undefined for one with no cross-client meaning.
 */
export type UrlTarget =
	| { kind: 'client'; link: AppLink }
	| { kind: 'own'; link: AppLink | undefined; path: string };

/**
 * recognises a URL this app can open and describes what it points at. another client's URL resolves only when
 * this app has a screen for that path.
 *
 * @param url the raw link target
 * @returns the destination, or undefined when the link belongs to the open web
 */
export const describeUrl = (url: string): UrlTarget | undefined => {
	const parsed = safeUrlParse(url);
	if (parsed === null) {
		return undefined;
	}

	if (isOwnUrl(parsed)) {
		// our paths are bsky.app's today, so its reader also describes ours.
		return {
			kind: 'own',
			link: parseBlueskyPath(parsed),
			path: parsed.pathname + parsed.search + parsed.hash,
		};
	}

	const link = schemeFor(parsed)?.parse(parsed);
	return link && { kind: 'client', link };
};

/**
 * describes what a URL names, without resolving where it goes — a post to quote, an invite code to redeem.
 *
 * @param url the raw link target
 * @returns what the URL names, or undefined if nothing this app understands
 */
export const resolveUrlToLink = (url: string): AppLink | undefined => {
	return describeUrl(url)?.link;
};

/**
 * whether a URL points at this app or another recognised client, rather than at the open web. true even for a
 * path with no screen here; use {@link describeUrl} to decide how to open a link.
 *
 * @param url the raw link target
 * @returns whether the URL belongs to a known client
 */
export const isClientUrl = (url: string): boolean => {
	const parsed = safeUrlParse(url);
	return parsed !== null && (isOwnUrl(parsed) || schemeFor(parsed) !== undefined);
};

// #endregion
