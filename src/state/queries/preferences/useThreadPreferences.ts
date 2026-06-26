import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';
import { useFocusEffect } from '@react-navigation/native';
import debounce from 'lodash.debounce';

import { useCallOnce } from '#/lib/once';

import { usePreferencesQuery, useSetThreadViewPreferencesMutation } from '#/state/queries/preferences';
import type { ThreadViewPreferences } from '#/state/queries/preferences/types';

import { logger } from '#/logger';

import type { Literal } from '#/types/utils';

export type ThreadSortOption = Literal<AppBskyUnspeccedGetPostThreadV2.$params['sort'], string>;
export type ThreadViewOption = 'linear' | 'tree';
export type ThreadPreferences = {
	isLoaded: boolean;
	isSaving: boolean;
	sort: ThreadSortOption;
	setSort: (sort: string) => void;
	view: ThreadViewOption;
	setView: (view: ThreadViewOption) => void;
};

export function useThreadPreferences({ save }: { save?: boolean } = {}): ThreadPreferences {
	const { data: preferences } = usePreferencesQuery();
	const serverPrefs = preferences?.threadViewPrefs;
	const once = useCallOnce();

	/*
	 * Create local state representations of server state
	 */
	const [sort, setSort] = useState(normalizeSort(serverPrefs?.sort || 'top'));
	const [view, setView] = useState(
		normalizeView({
			treeViewEnabled: !!serverPrefs?.lab_treeViewEnabled,
		}),
	);

	/** If we get a server update, update local state */
	const [prevServerPrefs, setPrevServerPrefs] = useState(serverPrefs);
	const isLoaded = !!prevServerPrefs;
	if (serverPrefs && prevServerPrefs !== serverPrefs) {
		setPrevServerPrefs(serverPrefs);

		/*
		 * Update
		 */
		setSort(normalizeSort(serverPrefs.sort));
		setView(
			normalizeView({
				treeViewEnabled: !!serverPrefs.lab_treeViewEnabled,
			}),
		);

		once(() => {});
	}

	const [userUpdatedPrefs, setUserUpdatedPrefs] = useState(false);
	const { mutate, isPending: isSaving } = useSetThreadViewPreferencesMutation({
		onSuccess: (_data, _prefs) => {},
		onError: (err) => {
			logger.error('useThreadPreferences failed to save', {
				safeMessage: err,
			});
		},
	});
	const savePrefs = useMemo(() => {
		return debounce(
			(prefs: ThreadViewPreferences) => {
				mutate(prefs);
			},
			2e3,
			{ leading: true, trailing: true },
		);
	}, [mutate]);

	// flush on leave screen
	useFocusEffect(
		useCallback(() => {
			return () => {
				void savePrefs.flush();
			};
		}, [savePrefs]),
	);

	// when saving is enabled and the user has pending changes, clear the pending flag during render
	// (render-time adjustment) and fire the debounced save in the effect below.
	if (save && userUpdatedPrefs) {
		setUserUpdatedPrefs(false);
	}

	// the save side effect runs after commit, off the render path. deps include userUpdatedPrefs so it
	// fires once per pending batch (the render-time clear above flips it back to false next render).
	useEffect(() => {
		if (save && userUpdatedPrefs) {
			savePrefs({
				sort,
				lab_treeViewEnabled: view === 'tree',
			});
		}
	}, [save, userUpdatedPrefs, sort, view, savePrefs]);

	const setSortWrapped = useCallback(
		(next: string) => {
			setUserUpdatedPrefs(true);
			setSort(normalizeSort(next));
		},
		[setSort],
	);
	const setViewWrapped = useCallback(
		(next: ThreadViewOption) => {
			setUserUpdatedPrefs(true);
			setView(next);
		},
		[setView],
	);

	return useMemo(
		() => ({
			isLoaded,
			isSaving,
			sort,
			setSort: setSortWrapped,
			view,
			setView: setViewWrapped,
		}),
		[isLoaded, isSaving, sort, setSortWrapped, view, setViewWrapped],
	);
}

/** Migrates user thread preferences from the old sort values to V2 */
export function normalizeSort(sort: string): ThreadSortOption {
	switch (sort) {
		case 'oldest':
			return 'oldest';
		case 'newest':
			return 'newest';
		default:
			return 'top';
	}
}

/** Transforms existing treeViewEnabled preference into a ThreadViewOption */
export function normalizeView({ treeViewEnabled }: { treeViewEnabled: boolean }): ThreadViewOption {
	return treeViewEnabled ? 'tree' : 'linear';
}
