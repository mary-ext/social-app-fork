import { useCallback } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { isJustAMute, moduiContainsHideableOffense } from '#/lib/moderation';
import { toModerationPreferences } from '#/lib/moderation/prefs';

import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { useModerationOpts } from '../preferences/moderation-opts';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from './preferences';

const DEFAULT_MOD_OPTS = {
	viewerDid: undefined,
	prefs: toModerationPreferences(DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs),
};

const RQKEY_ROOT = 'actor-autocomplete';
export const RQKEY = (prefix: string) => [RQKEY_ROOT, prefix];

export function useActorAutocompleteQuery(prefix: string, maintainData?: boolean, limit?: number) {
	const moderationOpts = useModerationOpts();
	const { appview } = useClients();

	let normalizedPrefix = prefix.toLowerCase().trim();
	if (normalizedPrefix.endsWith('.')) {
		// Going from "foo" to "foo." should not clear matches.
		normalizedPrefix = normalizedPrefix.slice(0, -1);
	}

	return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY(normalizedPrefix || ''),
		async queryFn() {
			if (!normalizedPrefix) return [];
			const data = await ok(
				appview.get('app.bsky.actor.searchActorsTypeahead', {
					params: { limit: limit || 8, q: normalizedPrefix },
				}),
			);
			return data.actors;
		},
		select: useCallback(
			(data: AppBskyActorDefs.ProfileViewBasic[]) => {
				return computeSuggestions({
					q: normalizedPrefix,
					searched: data,
					moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
				});
			},
			[normalizedPrefix, moderationOpts],
		),
		placeholderData: maintainData ? keepPreviousData : undefined,
	});
}

export function useActorAutocompleteFn() {
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();
	const { appview } = useClients();

	return useCallback(
		async ({ query, limit = 8 }: { query: string; limit?: number }) => {
			query = query.toLowerCase();
			let res;
			if (query) {
				try {
					res = await queryClient.fetchQuery({
						staleTime: STALE.MINUTES.ONE,
						queryKey: RQKEY(query || ''),
						queryFn: () =>
							ok(
								appview.get('app.bsky.actor.searchActorsTypeahead', {
									params: { limit, q: query },
								}),
							),
					});
				} catch (e) {
					logger.error('useActorSearch: searchActorsTypeahead failed', {
						message: e,
					});
				}
			}

			return computeSuggestions({
				q: query,
				searched: res?.actors,
				moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
			});
		},
		[queryClient, moderationOpts, appview],
	);
}

function computeSuggestions({
	q,
	searched = [],
	moderationOpts,
}: {
	q?: string;
	searched?: AppBskyActorDefs.ProfileViewBasic[];
	moderationOpts: ModerationOptions;
}) {
	let items: AppBskyActorDefs.ProfileViewBasic[] = [];
	for (const item of searched) {
		if (!items.find((item2) => item2.handle === item.handle)) {
			items.push(item);
		}
	}
	return items.filter((profile) => {
		const modui = getDisplayRestrictions(
			moderateProfile(profile, moderationOpts),
			DisplayContext.ProfileList,
		);
		const isExactMatch = q && profile.handle.toLowerCase() === q;
		return (
			(isExactMatch && !moduiContainsHideableOffense(modui)) ||
			modui.filters.length === 0 ||
			isJustAMute(modui)
		);
	});
}
