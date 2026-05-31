/**
 * The `@atproto/api`-shaped preferences aggregate the fork's preferences cache derives, and the
 * `@atproto/api`-shaped actor defs its entries (saved feeds, muted words) are built from. The deferred
 * moderation engine consumes these via `BskyPreferences.moderationPrefs` → `ModerationOpts`, so they stay on
 * `@atproto/api` inside the bounded moderation island until the engine migrates (see ATCUTE-ROADMAP.md
 * Appendix A).
 */
export type {
	AppBskyActorDefs,
	BskyFeedViewPreference,
	BskyInterestsPreference,
	BskyPreferences,
	BskyThreadViewPreference,
} from '@atproto/api';
