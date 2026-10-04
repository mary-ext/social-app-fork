import { type Client, ok } from '@atcute/client';
import type { Did, Handle } from '@atcute/lexicons';

import { bakeRichtext, parseRichtext, resolveMentions, type Richtext, shortenLinks } from '#/lib/rich-text';

/** resolves a handle to its DID, or undefined on failure. */
export type HandleResolver = (handle: Handle) => Promise<Did | undefined>;

/**
 * prepares rich text via {@link prepareRichtext}, using appview handle resolution.
 *
 * @param appview the appview client
 * @param text the source text
 * @returns publishable rich text
 */
export async function prepareRichtextForPublish(appview: Client, text: string): Promise<Richtext> {
	return prepareRichtext(text, createHandleResolver(appview));
}

/**
 * resolves mentions and shortens links for publishing.
 *
 * @param text the source text
 * @param resolve the handle resolver
 * @returns publishable rich text
 */
export async function prepareRichtext(text: string, resolve: HandleResolver): Promise<Richtext> {
	const segments = await resolveMentions(parseRichtext(text), resolve);
	return bakeRichtext(shortenLinks(segments));
}

/**
 * creates an appview-backed handle resolver.
 *
 * @param appview the appview client
 * @returns a handle resolver
 */
export const createHandleResolver = (appview: Client): HandleResolver => {
	return async (handle) => {
		try {
			const res = await ok(appview.get('com.atproto.identity.resolveHandle', { params: { handle } }));
			return res.did;
		} catch {
			return undefined;
		}
	};
};

/**
 * creates an appview-backed resolver that caches lookups, including failures, for its lifetime.
 *
 * @param appview the appview client
 * @returns a handle resolver with its own cache
 */
export const createCachedHandleResolver = (appview: Client): HandleResolver => {
	const resolve = createHandleResolver(appview);
	const cache = new Map<Handle, Promise<Did | undefined>>();

	return (handle) => {
		let promise = cache.get(handle);
		if (promise === undefined) {
			promise = resolve(handle);
			cache.set(handle, promise);
		}

		return promise;
	};
};
