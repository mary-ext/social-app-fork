import type { AppBskyActorDefs } from '@atcute/bluesky';

/**
 * the fork-owned shape of the preferences aggregate the preferences cache derives, and the moderation
 * preference interface the app persists. back on `@atcute/bluesky` lexicon records (the PDS wire types) but
 * not on `@atcute/bluesky-moderation`'s engine types.
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
	labelers: LabelerPreference[];
	labels: Record<string, LabelVisibility>;
	mutedWords: AppBskyActorDefs.MutedWord[];
}

export type BskyFeedViewPreference = Omit<AppBskyActorDefs.FeedViewPref, '$type' | 'feed'>;
export type BskyThreadViewPreference = Omit<AppBskyActorDefs.ThreadViewPref, '$type'>;
export type BskyInterestsPreference = Omit<AppBskyActorDefs.InterestsPref, '$type'>;

/** The derived preferences aggregate produced by the preferences cache. */
export interface BskyPreferences {
	feedViewPrefs: { [feed: string]: BskyFeedViewPreference };
	feeds: { pinned: string[] | undefined; saved: string[] | undefined };
	interests: BskyInterestsPreference;
	moderationPrefs: ModerationPrefs;
	postInteractionSettings: {
		postgateEmbeddingRules: AppBskyActorDefs.PostInteractionSettingsPref['postgateEmbeddingRules'];
		threadgateAllowRules: AppBskyActorDefs.PostInteractionSettingsPref['threadgateAllowRules'];
	};
	savedFeeds: AppBskyActorDefs.SavedFeed[];
	threadViewPrefs: BskyThreadViewPreference;
	verificationPrefs: { hideBadges: boolean };
}
