import { useCallback } from 'react';

import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
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

import { STALE } from '#/state/queries';
import { getClients } from '#/state/session';

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
	const { appview } = getClients();

	let normalizedPrefix = prefix.toLowerCase().trim();
	if (normalizedPrefix.endsWith('.')) {
		// Going from "foo" to "foo." should not clear matches.
		normalizedPrefix = normalizedPrefix.slice(0, -1);
	}

	return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY(normalizedPrefix || ''),
		async queryFn() {
			if (!normalizedPrefix) {
				return [];
			}
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

/**
 * query actor suggestions for search bar autocomplete. returns the current user when the query is empty.
 *
 * @param limit max suggestions to request
 * @param query search query or handle fragment
 * @param self profile to return when the query is empty
 * @returns moderated suggestion list query
 */
export function useSearchActorAutocompleteQuery({
	limit,
	query,
	self,
}: {
	limit: number;
	query: string;
	self: AnyProfileView | undefined;
}) {
	const moderationOpts = useModerationOpts();
	const { appview } = getClients();

	let normalizedPrefix = query.toLowerCase().trim();
	if (normalizedPrefix.endsWith('.')) {
		// Going from "foo" to "foo." should not clear matches.
		normalizedPrefix = normalizedPrefix.slice(0, -1);
	}

	return useQuery<AnyProfileView[]>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: [RQKEY_ROOT, 'search', self?.did ?? null, normalizedPrefix],
		async queryFn() {
			if (!normalizedPrefix) {
				return self ? [self] : [];
			}
			const data = await ok(
				appview.get('app.bsky.actor.searchActorsTypeahead', {
					params: { limit, q: normalizedPrefix },
				}),
			);
			return data.actors;
		},
		select: useCallback(
			(data: AnyProfileView[]) =>
				computeSuggestions({
					q: normalizedPrefix,
					searched: data,
					moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
				}),
			[normalizedPrefix, moderationOpts],
		),
		placeholderData: keepPreviousData,
	});
}

function computeSuggestions<T extends AnyProfileView>({
	q,
	searched = [],
	moderationOpts,
}: {
	q?: string;
	searched?: T[];
	moderationOpts: ModerationOptions;
}): T[] {
	const items: T[] = [];
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
		const isExactMatch = profile.handle.toLowerCase() === q;
		return (
			(isExactMatch && !moduiContainsHideableOffense(modui)) ||
			modui.filters.length === 0 ||
			isJustAMute(modui)
		);
	});
}
