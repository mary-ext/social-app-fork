import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { isJustAMute, moduiContainsHideableOffense } from '#/lib/moderation/causes';
import { toModerationPreferences } from '#/lib/moderation/preferences';
import type { CompletionType } from '#/lib/rich-text-input';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { STALE } from '#/state/queries';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

import { emojiDatasetQuery, emojiSearchQuery } from '#/components/EmojiPicker/data';

// #region types

export type AutocompleteProfile = {
	type: 'profile';
	key: string;
	value: string;
	profile: AnyProfileView;
};

export type AutocompleteTag = {
	type: 'tag';
	key: string;
	value: string;
	tag: string;
};

export type AutocompleteEmoji = {
	type: 'emoji';
	key: string;
	value: string;
	label: string;
};

export type AutocompleteSearch = {
	type: 'search';
	key: string;
	value: string;
};

export type AutocompleteItem = AutocompleteProfile | AutocompleteTag | AutocompleteEmoji | AutocompleteSearch;

export type AutocompleteItemType = AutocompleteItem['type'];

export type AutocompleteApi = {
	query: string;
	items: AutocompleteItem[];
	/** fetching the current query; items may still be from the previous query. */
	isFetching: boolean;
};

/**
 * maps a completion trigger to its suggestion type.
 *
 * @param type the completion's trigger type
 * @returns the autocomplete item type to query
 */
export function parseAutocompleteItemType(type: CompletionType): AutocompleteItemType {
	switch (type) {
		case 'mention': {
			return 'profile';
		}
		case 'tag': {
			return 'tag';
		}
		case 'emoji': {
			return 'emoji';
		}
	}
}

// #endregion

// #region queries

const DEFAULT_MOD_OPTS = {
	viewerDid: undefined,
	prefs: toModerationPreferences(DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs),
};

export function useAutocomplete({
	type,
	query: q,
	limit,
	showSearchFallback = false,
}: {
	type: AutocompleteItemType;
	query: string;
	limit?: number;
	showSearchFallback?: boolean;
}): AutocompleteApi {
	const { appview } = getClients();
	const moderationOpts = useModerationOpts();
	const emojiSearch = useEmojiSearch();

	// ignore case and a trailing dot in profile search and exact-match moderation, so typing
	// a handle's next segment keeps existing matches. emoji and search fallback use the raw query.
	const profileQuery = q.toLowerCase().trim().replace(/\.$/, '');

	const query = useQuery({
		queryKey: [
			'autocomplete',
			{
				type,
				query: q,
			},
		],
		staleTime: STALE.MINUTES.ONE,
		async queryFn({ signal }) {
			if (type === 'profile') {
				// TODO return recents
				if (!q) {
					return [];
				}

				const data = await ok(
					appview.get('app.bsky.actor.searchActorsTypeahead', {
						signal,
						params: { limit: limit || 8, q: profileQuery },
					}),
				);

				return data.actors.map((profile) => ({
					key: profile.did,
					type: 'profile' as const,
					value: '@' + profile.handle,
					profile,
				}));
			} else if (type === 'emoji') {
				return emojiSearch(q, limit || 8);
			}

			return [];
		},
		placeholderData: keepPreviousData,
		select: (items: AutocompleteItem[]) => {
			const seen = new Set<string>();
			const results: AutocompleteItem[] = [];

			for (const item of items) {
				if (seen.has(item.key)) {
					continue;
				}
				seen.add(item.key);

				if (item.type === 'profile') {
					const moderated = moderateProfileItem({
						query: profileQuery,
						item,
						moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
					});
					if (moderated) {
						results.push(moderated);
					}
				} else {
					results.push(item);
				}
			}

			return results;
		},
	});

	let items: AutocompleteItem[] = [];
	if (query.data) {
		items = [...query.data];

		if (showSearchFallback && q) {
			items.unshift({
				key: `search-${q}`,
				type: 'search' as const,
				value: q,
			});
		}
	}

	return {
		query: q,
		items,
		isFetching: query.isFetching,
	};
}

function useEmojiSearch(): (query: string, limit?: number) => Promise<AutocompleteEmoji[]> {
	const queryClient = useQueryClient();
	return async (query: string, limit: number = 8) => {
		const [dataset, search] = await Promise.all([
			queryClient.fetchQuery(emojiDatasetQuery()),
			queryClient.fetchQuery(emojiSearchQuery()),
		]);
		return search(query, limit).map((index) => ({
			type: 'emoji' as const,
			key: dataset.ids[index]!,
			label: dataset.names[index]!,
			value: dataset.natives[index]!,
		}));
	};
}

function moderateProfileItem({
	query,
	item,
	moderationOpts,
}: {
	query: string;
	item: AutocompleteProfile;
	moderationOpts: ModerationOptions;
}) {
	const modui = getDisplayRestrictions(
		moderateProfile(item.profile, moderationOpts),
		DisplayContext.ProfileList,
	);
	const isExactMatch = item.profile.handle.toLowerCase() === query;

	if (
		(isExactMatch && !moduiContainsHideableOffense(modui)) ||
		modui.filters.length === 0 ||
		isJustAMute(modui)
	) {
		return item;
	}

	return null;
}

// #endregion
