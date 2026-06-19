import { DEFAULT_LOGGED_OUT_LABEL_PREFERENCES } from '#/state/queries/preferences/moderation';
import type { ThreadViewPreferences, UsePreferencesQueryResponse } from '#/state/queries/preferences/types';

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
		hiddenPosts: [],
	},
	feedViewPrefs: DEFAULT_HOME_FEED_PREFS,
	threadViewPrefs: DEFAULT_THREAD_VIEW_PREFS,
	interests: { tags: [] },
	savedFeeds: [],
	postInteractionSettings: {
		threadgateAllowRules: undefined,
		postgateEmbeddingRules: [],
	},
	verificationPrefs: {
		hideBadges: false,
	},
};
