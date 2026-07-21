import { useCallback } from 'react';

import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { isJustAMute, moduiContainsHideableOffense } from '#/lib/moderation';
import { toModerationPreferences } from '#/lib/moderation/prefs';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { STALE } from '#/state/queries';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from '#/state/queries/preferences';
import { useClients } from '#/state/session';

import type {
	AutocompleteApi,
	AutocompleteItem,
	AutocompleteItemType,
	AutocompleteProfile,
} from '#/components/Composer/Autocomplete/types';

import { useEmojiSearch } from './useEmojiSearch';

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
	const { appview } = useClients();
	const moderationOpts = useModerationOpts();
	const emojiSearch = useEmojiSearch();

	// normalized form used for profile search and exact-handle moderation: "foo." and "FOO" should
	// match "foo". emoji/search fallback still use the raw query.
	const profileQuery = q.toLowerCase().trim().replace(/\.$/, '');

	const query = useQuery({
		staleTime: STALE.MINUTES.ONE,
		queryKey: [
			'autocomplete',
			{
				type,
				query: q,
			},
		],
		async queryFn() {
			if (type === 'profile') {
				// TODO return recents
				if (!q) return [];

				// Going from "foo" to "foo." should not clear matches.
				const data = await ok(
					appview.get('app.bsky.actor.searchActorsTypeahead', {
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
		select: useCallback(
			(items: AutocompleteItem[]) => {
				const seen = new Set<string>();
				const results: AutocompleteItem[] = [];

				for (const item of items) {
					if (seen.has(item.key)) continue;
					seen.add(item.key);

					if (item.type === 'profile') {
						const moderated = moderateProfileItem({
							query: profileQuery,
							item,
							moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
						});
						if (moderated) results.push(moderated);
					} else {
						results.push(item);
					}
				}

				return results;
			},
			[profileQuery, moderationOpts],
		),
		placeholderData: keepPreviousData,
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
