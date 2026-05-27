import { type AppBskyFeedDefs, type AppBskyGraphDefs } from '@atcute/bluesky';
import {
	moderateFeedGenerator as moderateFeedGeneratorEngine,
	moderatePost as moderatePostEngine,
	moderateProfile as moderateProfileEngine,
	moderateStatus as moderateStatusEngine,
	moderateUserList as moderateUserListEngine,
	type ModerationOpts,
	type ModerationSubjectFeedGenerator,
	type ModerationSubjectPost,
	type ModerationSubjectProfile,
	type ModerationSubjectUserList,
} from '@atproto/api';

import type * as bsky from '#/types/bsky';

/**
 * Moderation compatibility adapter.
 *
 * Moderation stays on `@atproto/api` — its migration is deferred (see ATCUTE-ROADMAP.md Appendix A). These
 * wrappers accept `@atcute`-typed views, cast them to `@atproto/api`'s nominally-distinct equivalents, run
 * the real moderation engine, and return its decision. Every app call site imports moderation from here, so
 * flipping a view type to `@atcute` in a Stream 2 phase does not break moderation.
 *
 * This is a long-lived adapter, not temporary scaffolding — it is the intended state until the moderation
 * engine itself migrates (Appendix A), at which point only files in this directory change.
 */

export type { ModerationCause, ModerationDecision, ModerationOpts } from '@atproto/api';

/**
 * Runs the moderation engine against a profile view.
 *
 * @param subject the profile view.
 * @param opts the moderation options.
 * @returns the moderation decision.
 */
export const moderateProfile = (subject: bsky.profile.AnyProfileView, opts: ModerationOpts) => {
	return moderateProfileEngine(subject as unknown as ModerationSubjectProfile, opts);
};

/**
 * Runs the moderation engine against a post view.
 *
 * @param subject the `@atcute`-typed post view.
 * @param opts the moderation options.
 * @returns the moderation decision.
 */
export const moderatePost = (subject: AppBskyFeedDefs.PostView, opts: ModerationOpts) => {
	return moderatePostEngine(subject as unknown as ModerationSubjectPost, opts);
};

/**
 * Runs the moderation engine against a list view.
 *
 * @param subject the `@atcute`-typed list view.
 * @param opts the moderation options.
 * @returns the moderation decision.
 */
export const moderateUserList = (
	subject: AppBskyGraphDefs.ListView | AppBskyGraphDefs.ListViewBasic,
	opts: ModerationOpts,
) => {
	return moderateUserListEngine(subject as unknown as ModerationSubjectUserList, opts);
};

/**
 * Runs the moderation engine against a feed generator view.
 *
 * @param subject the `@atcute`-typed feed generator view.
 * @param opts the moderation options.
 * @returns the moderation decision.
 */
export const moderateFeedGenerator = (subject: AppBskyFeedDefs.GeneratorView, opts: ModerationOpts) => {
	return moderateFeedGeneratorEngine(subject as unknown as ModerationSubjectFeedGenerator, opts);
};

/**
 * Runs the moderation engine against a profile carrying a status view.
 *
 * @param subject the `@atcute`-typed profile view (must include `status`).
 * @param opts the moderation options.
 * @returns the moderation decision.
 */
export const moderateStatus = (subject: bsky.profile.AnyProfileView, opts: ModerationOpts) => {
	return moderateStatusEngine(subject as unknown as ModerationSubjectProfile, opts);
};
