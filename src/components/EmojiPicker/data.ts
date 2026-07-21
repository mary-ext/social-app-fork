import { definite, unique } from '@mary/array-fns';

import type { Emoji as DataEmoji, EmojiMartData } from '@emoji-mart/data';
import { queryOptions } from '@tanstack/react-query';

import { GCTIME, STALE } from '#/state/queries';

import { searchEmojiIds, type SearchEntry } from './search';

/** the loaded emoji dataset plus a search function over it. */
export type EmojiData = {
	categories: EmojiMartData['categories'];
	emojis: EmojiMartData['emojis'];
	/**
	 * searches the dataset for emoji matching a query.
	 *
	 * @param query the search query
	 * @param limit maximum number of results (defaults to 90)
	 * @returns the matching emoji, best match first
	 */
	search: (query: string, limit?: number) => DataEmoji[];
};

/** query options for the emoji dataset, shared so the picker and autocomplete load and cache it once. */
export function emojiDataQuery() {
	return queryOptions({
		gcTime: GCTIME.INFINITY,
		queryFn: loadEmojiData,
		queryKey: ['emoji-data'],
		staleTime: STALE.INFINITY,
	});
}

/**
 * loads `@emoji-mart/data` and builds a search index over it.
 *
 * @returns the dataset and a search function over it
 */
async function loadEmojiData(): Promise<EmojiData> {
	// ~400 KB dataset
	const mod = await import('@emoji-mart/data');
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the package's runtime module is the JSON dataset, not its declarations
	const data = (mod.default ?? mod) as unknown as EmojiMartData;
	const entries: SearchEntry[] = Object.values(data.emojis).map((emoji) => ({
		haystack: buildHaystack(emoji),
		id: emoji.id,
	}));
	return {
		categories: data.categories,
		emojis: data.emojis,
		search: (query: string, limit = 90) =>
			searchEmojiIds(entries, query, limit).map((id) => data.emojis[id]!),
	};
}

/** builds the comma-delimited, lowercased haystack searched by {@link searchEmojiIds}. */
function buildHaystack(emoji: DataEmoji): string {
	const terms = definite(
		[emoji.id, emoji.name, ...emoji.keywords, ...(emoji.emoticons ?? [])].flatMap((term) =>
			term.toLowerCase().split(/\s+/),
		),
	);

	return `,${unique(terms).join(',')}`;
}
