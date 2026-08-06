import { type Client, ok } from '@atcute/client';
import type { Did, Handle } from '@atcute/lexicons';

import { bakeRichtext, parseRichtext, resolveMentions, type Richtext, shortenLinks } from '#/lib/rich-text';

/**
 * creates publishable rich text with resolved mentions and shortened links.
 *
 * @param appview the appview client
 * @param text the source text
 * @returns publishable rich text
 */
export async function prepareRichtextForPublish(appview: Client, text: string): Promise<Richtext> {
	const segments = await resolveMentions(parseRichtext(text), createHandleResolver(appview));
	return bakeRichtext(shortenLinks(segments));
}

/**
 * creates an appview-backed handle resolver.
 *
 * @param appview the appview client
 * @returns a resolver that returns undefined on failure
 */
export const createHandleResolver = (appview: Client) => {
	return async (handle: Handle): Promise<Did | undefined> => {
		try {
			const res = await ok(appview.get('com.atproto.identity.resolveHandle', { params: { handle } }));
			return res.did;
		} catch {
			return undefined;
		}
	};
};
