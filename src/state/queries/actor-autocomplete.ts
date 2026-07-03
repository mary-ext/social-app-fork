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
import { useClients } from '#/state/session';

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

/**
 * actor typeahead for the search bar's `from:`/`to:`/`mentions:` completion. unlike
 * {@link useActorAutocompleteQuery}, an empty query resolves to `self` (the signed-in account) rather than
 * nothing. because that empty state shares one query-cache continuum with the typed-prefix searches,
 * `keepPreviousData` bridges the jump from `from:` to `from:<first char>` — the popup keeps showing the prior
 * suggestion while the first search loads instead of flashing an empty list.
 *
 * @param limit max suggestions to request
 * @param query the handle fragment after the operator (empty while the operator alone is typed)
 * @param self the profile to surface when nothing is typed yet, or undefined to surface nothing
 * @returns the moderated suggestion list query
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
	const { appview } = useClients();

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
	let items: T[] = [];
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
