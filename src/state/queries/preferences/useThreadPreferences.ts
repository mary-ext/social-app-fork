import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

	// latch set in the setters below (event callbacks, not render) and read + cleared after commit.
	// a plain ref is safe here: it's never read or written during render, only in the effect.
	const userUpdatedPrefs = useRef(false);
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
				savePrefs.flush();
			};
		}, [savePrefs]),
	);

	// persist a pending user change after commit. the latch is set in the setters and read + cleared
	// here, off the render path, so the save always observes what the setters wrote. deps include
	// `sort`/`view` so each value change re-runs and persists the latest values; `savePrefs`
	// debounces them server-side (leading+trailing).
	useEffect(() => {
		if (save && userUpdatedPrefs.current) {
			userUpdatedPrefs.current = false;
			savePrefs({
				sort,
				lab_treeViewEnabled: view === 'tree',
			});
		}
	}, [save, sort, view, savePrefs]);

	const setSortWrapped = (next: string) => {
		userUpdatedPrefs.current = true;
		setSort(normalizeSort(next));
	};
	const setViewWrapped = (next: ThreadViewOption) => {
		userUpdatedPrefs.current = true;
		setView(next);
	};

	return {
		isLoaded,
		isSaving,
		sort,
		setSort: setSortWrapped,
		view,
		setView: setViewWrapped,
	};
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
