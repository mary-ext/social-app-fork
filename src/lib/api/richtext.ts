import type { Client } from '@atcute/client';

import { createHandleResolver } from '#/lib/api/identity';
import { bakeRichtext, parseRichtext, resolveMentions, type Richtext, shortenLinks } from '#/lib/rich-text';

/**
 * creates publishable rich text with resolved mentions and shortened links.
 *
 * @param appview the appview client
 * @param text the source text
 * @returns publishable rich text
 */
export async function resolvePublishedRichtext(appview: Client, text: string): Promise<Richtext> {
	const segments = await resolveMentions(parseRichtext(text), createHandleResolver(appview));
	return bakeRichtext(shortenLinks(segments));
}
