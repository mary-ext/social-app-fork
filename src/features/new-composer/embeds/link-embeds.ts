import type { Wordgard } from 'wordgard/editor';
import { Transaction } from 'wordgard/state';

import { resolveUrlToLink } from '#/lib/links/app-url';

import type { PostMedia } from '../editor/schema';
import type { PostLink, PostText, TrailingLink } from '../editor/text-measurement';

// derive embeds from text so they follow their URLs through splits, joins, and reorders.
//
// TODO: when publishing is implemented:
// - resolve URLs with `fetchResolveLinkQuery` to reuse cached previews and retry failures.
// - use `app.bsky.embed.recordWithMedia` for records with media or an external card;
//   otherwise use `app.bsky.embed.record` or `app.bsky.embed.external`.
// - truncate at `stripped.textEnd` only if that link's embed is included. on resolution
//   failure, keep the link as text and allow publishing.

export type LinkEmbedKind = 'external' | 'record';

/**
 * classifies a link by the embed slot it fills, without resolving it.
 *
 * @param url the link's URL
 * @returns `record` for links to posts, feeds, lists, and starter packs; `external` otherwise
 */
export const getLinkEmbedKind = (url: string): LinkEmbedKind => {
	switch (resolveUrlToLink(url)?.kind) {
		case 'bskyStarterPackCode':
		case 'feed':
		case 'list':
		case 'post':
		case 'starterPack': {
			return 'record';
		}
		default: {
			return 'external';
		}
	}
};

export type PostEmbeds = {
	/** URL shown as an external link card, or null. */
	external: string | null;
	/** URL shown as a record embed (quoted post, feed, list, or starter pack), or null. */
	record: string | null;
};

/** URL state shared across all posts in the composer. */
export type EmbedSession = {
	/** URLs the user dismissed. they aren't embedded again for the rest of the session. */
	dismissed: ReadonlySet<string>;
	/** URLs the caret has left at least once. links still being typed aren't embedded or fetched. */
	settled: ReadonlySet<string>;
};

export const emptyEmbedSession: EmbedSession = { dismissed: new Set(), settled: new Set() };

/** dismisses a URL's embed for the rest of the session. */
export const dismissLinkEmbedEffect = Transaction.Effect.define<string>();

/**
 * stops embedding a URL for the rest of the session, in every post. not undoable.
 *
 * @param wg the editor
 * @param url the dismissed link's URL
 */
export const dismissLinkEmbed = (wg: Wordgard, url: string) => {
	wg.dispatch({ effects: dismissLinkEmbedEffect.of(url) });
};

export type EmbedSelection = {
	embeds: PostEmbeds;
	/** trailing link to remove on successful embedding, or null. */
	stripped: TrailingLink | null;
};

/**
 * selects the last settled link per embed kind. dismissed links leave their slot empty.
 *
 * @param measurement the post's measured text
 * @param media the post's media, which takes precedence over an external card
 * @param session the composer's embed session
 * @returns selected embeds and the trailing link eligible for removal
 */
export const selectPostEmbeds = (
	{ links, trailingLink }: PostText,
	media: readonly PostMedia[],
	session: EmbedSession,
): EmbedSelection => {
	let external: PostLink | null = null;
	let record: PostLink | null = null;
	for (const link of links) {
		if (!session.settled.has(link.url)) {
			continue;
		}

		switch (link.kind) {
			case 'external': {
				external = link;
				break;
			}
			case 'record': {
				record = link;
				break;
			}
		}
	}

	// a dismissed link doesn't hand its slot to an earlier link.
	if (external && (media.length > 0 || session.dismissed.has(external.url))) {
		external = null;
	}
	if (record && session.dismissed.has(record.url)) {
		record = null;
	}

	const isStripped = trailingLink && (trailingLink.link === external || trailingLink.link === record);

	return {
		embeds: { external: external?.url ?? null, record: record?.url ?? null },
		stripped: isStripped ? trailingLink : null,
	};
};
