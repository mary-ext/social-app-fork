import type { BskyFeedViewPreference, BskyPreferences } from '#/lib/moderation/preferences-types';

export type UsePreferencesQueryResponse = Omit<
	BskyPreferences,
	'contentLabels' | 'feedViewPrefs' | 'feeds'
> & {
	feedViewPrefs: BskyFeedViewPreference;
	/** User thread-view prefs, including newer fields that may not be typed yet. */
	threadViewPrefs: ThreadViewPreferences;
};

export type ThreadViewPreferences = {
	sort: 'hotness' | 'oldest' | 'newest' | 'most-likes' | 'random' | (string & {});
	lab_treeViewEnabled?: boolean;
};
