import { DEFAULT_LABEL_SETTINGS } from '#/lib/moderation/preferences';
import { DEFAULT_APP_SPECIFIC_PREF } from '#/lib/preferences/app-specific-prefs';
import type { ThreadViewPreferences, UsePreferencesQueryResponse } from '#/lib/preferences/types';

/** More strict than our default settings for logged in users. */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: typeof DEFAULT_LABEL_SETTINGS = Object.fromEntries(
	Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
);

export const DEFAULT_HOME_FEED_PREFS: UsePreferencesQueryResponse['feedViewPrefs'] = {
	hideReplies: false,
	hideRepliesByUnfollowed: true, // Legacy, ignored
	hideRepliesByLikeCount: 0, // Legacy, ignored
	hideReposts: false,
	hideQuotePosts: false,
};

export const DEFAULT_THREAD_VIEW_PREFS: ThreadViewPreferences = {
	sort: 'hotness',
	lab_treeViewEnabled: false,
};

export const DEFAULT_LOGGED_OUT_PREFERENCES: UsePreferencesQueryResponse = {
	moderationPrefs: {
		adultContentEnabled: false,
		labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
		labelers: [],
		mutedWords: [],
	},
	feedViewPrefs: DEFAULT_HOME_FEED_PREFS,
	threadViewPrefs: DEFAULT_THREAD_VIEW_PREFS,
	interests: { tags: [] },
	appPrefs: DEFAULT_APP_SPECIFIC_PREF,
	savedFeeds: [],
	postInteractionSettings: {
		threadgateAllowRules: undefined,
		postgateEmbeddingRules: [],
	},
	verificationPrefs: {
		hideBadges: false,
	},
};
