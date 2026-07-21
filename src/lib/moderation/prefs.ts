import { interpretMutedWordPreference, type ModerationPreferences } from '@atcute/bluesky-moderation';

import type { BskyPreferences } from '#/lib/moderation/preferences-types';

/**
 * Converts the fork's @atproto-shaped moderation preferences (still produced by the preferences cache) into
 *
 * @param moderationPrefs the @atproto-shaped moderation preferences.
 * @returns the @atcute moderation preferences.
 * @atcute's `ModerationPreferences`.
 */
export const toModerationPreferences = (
	moderationPrefs: BskyPreferences['moderationPrefs'],
): ModerationPreferences => ({
	adultContentEnabled: moderationPrefs.adultContentEnabled,
	globalLabelPrefs: moderationPrefs.labels,
	keywordFilters: moderationPrefs.mutedWords.map((word) => interpretMutedWordPreference(word)),
	prefsByLabelers: Object.fromEntries(
		moderationPrefs.labelers.map((labeler) => [labeler.did, { labelPrefs: labeler.labels }]),
	),
	temporaryMutes: [],
});
