import type { AppBskyActorDefs } from '@atcute/bluesky';

/**
 * The fork-owned shape of the preferences aggregate the preferences cache derives, and the moderation
 * preference interface the app persists. These are the fork's own types — they back on `@atcute/bluesky`
 * lexicon records (the PDS wire types) but NOT on `@atcute/bluesky-moderation`'s engine types, which are an
 * interpreted engine-input shape. {@link BskyPreferences.moderationPrefs} is converted to the engine's
 * `ModerationPreferences` at the boundary (see `#/lib/moderation/prefs`).
 */

export type { AppBskyActorDefs };

/** The app's persisted visibility setting for a moderation label. */
export type LabelVisibility = 'hide' | 'ignore' | 'warn';

/** A subscribed labeler and the per-label visibility the user has chosen for it. */
export interface LabelerPreference {
	did: string;
	labels: Record<string, LabelVisibility>;
}

/** The app's own persisted moderation preferences. */
export interface ModerationPrefs {
	adultContentEnabled: boolean;
	hiddenPosts: string[];
	labelers: LabelerPreference[];
	labels: Record<string, LabelVisibility>;
	mutedWords: AppBskyActorDefs.MutedWord[];
}

export type BskyFeedViewPreference = Omit<AppBskyActorDefs.FeedViewPref, '$type' | 'feed'> & {
	lab_mergeFeedEnabled?: boolean;
};
export type BskyThreadViewPreference = Omit<AppBskyActorDefs.ThreadViewPref, '$type'>;
export type BskyInterestsPreference = Omit<AppBskyActorDefs.InterestsPref, '$type'>;

/** The derived preferences aggregate produced by the preferences cache. */
export interface BskyPreferences {
	bskyAppState: {
		activeProgressGuide: AppBskyActorDefs.BskyAppProgressGuide | undefined;
		nuxs: AppBskyActorDefs.Nux[];
		queuedNudges: string[];
	};
	birthDate: Date | undefined;
	declaredAge?: Omit<AppBskyActorDefs.DeclaredAgePref, '$type'>;
	feedViewPrefs: { [feed: string]: BskyFeedViewPreference };
	feeds: { pinned: string[] | undefined; saved: string[] | undefined };
	interests: BskyInterestsPreference;
	liveEventPreferences: { hiddenFeedIds: string[]; hideAllFeeds: boolean };
	moderationPrefs: ModerationPrefs;
	postInteractionSettings: {
		postgateEmbeddingRules: AppBskyActorDefs.PostInteractionSettingsPref['postgateEmbeddingRules'];
		threadgateAllowRules: AppBskyActorDefs.PostInteractionSettingsPref['threadgateAllowRules'];
	};
	savedFeeds: AppBskyActorDefs.SavedFeed[];
	threadViewPrefs: BskyThreadViewPreference;
	verificationPrefs: { hideBadges: boolean };
}
