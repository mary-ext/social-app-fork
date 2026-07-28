import {
	type InterpretedLabelDefinition,
	interpretMutedWordPreference,
	type ModerationPreferences,
} from '@atcute/bluesky-moderation';

import type { BskyPreferences, LabelVisibility } from '#/lib/moderation/preferences-types';

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

/**
 * Resolves the visibility a label takes when no labeler-scoped preference overrides it — the tail of the
 * chain the moderation engine walks.
 *
 * @param moderationPrefs the @atproto-shaped moderation preferences.
 * @param labelDefinition the label being resolved.
 * @returns the global preference for the label value, else the definition's default.
 */
export const resolveGlobalLabelPreference = (
	moderationPrefs: BskyPreferences['moderationPrefs'],
	labelDefinition: InterpretedLabelDefinition,
): LabelVisibility => moderationPrefs.labels[labelDefinition.identifier] ?? labelDefinition.defaultPref;
