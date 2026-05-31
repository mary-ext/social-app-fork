import { interpretMutedWordPreference, type ModerationPreferences } from '@atcute/bluesky-moderation';
import { type CanonicalResourceUri, type Did } from '@atcute/lexicons';

import { type BskyPreferences } from '#/lib/moderation/preferences-types';

/**
 * Converts the fork's @atproto-shaped moderation preferences (still produced by the preferences cache) into
 *
 * @param moderationPrefs the @atproto-shaped moderation preferences.
 * @param hiddenPosts the hidden-post URIs, defaulting to `moderationPrefs.hiddenPosts`.
 * @returns the @atcute moderation preferences.
 * @atcute's `ModerationPreferences`.
 */
export const toModerationPreferences = (
	moderationPrefs: BskyPreferences['moderationPrefs'],
	hiddenPosts?: readonly string[],
): ModerationPreferences => ({
	adultContentEnabled: moderationPrefs.adultContentEnabled,
	globalLabelPrefs: moderationPrefs.labels,
	hiddenPosts: (hiddenPosts ?? moderationPrefs.hiddenPosts) as CanonicalResourceUri[],
	keywordFilters: moderationPrefs.mutedWords.map((word) => interpretMutedWordPreference(word)),
	prefsByLabelers: Object.fromEntries(
		moderationPrefs.labelers.map((labeler) => [labeler.did as Did, { labelPrefs: labeler.labels }]),
	),
	temporaryMutes: [],
});
