import { m } from '#/paraglide/messages';

export interface GlobalLabelStrings {
	name: string;
	description: string;
}

const GLOBAL_LABEL_STRINGS: Record<string, () => GlobalLabelStrings> = {
	'!hide': () => ({
		name: m['lib.moderation.contentBlocked'](),
		description: m['lib.moderation.hiddenByModerators'](),
	}),
	'!warn': () => ({
		name: m['common.moderation.contentWarning'](),
		description: m['lib.moderation.generalWarning'](),
	}),
	'!no-unauthenticated': () => ({
		name: m['common.session.signInRequiredTitle'](),
		description: m['lib.moderation.signedInOnly'](),
	}),
	porn: () => ({
		name: m['common.moderation.adultContent'](),
		description: m['lib.moderation.explicitSexual'](),
	}),
	sexual: () => ({
		name: m['lib.moderation.sexuallySuggestive'](),
		description: m['lib.moderation.noNudity'](),
	}),
	nudity: () => ({
		name: m['lib.moderation.nonSexualNudity'](),
		description: m['lib.moderation.artisticNudesExample'](),
	}),
	'graphic-media': () => ({
		name: m['common.moderation.graphicMedia'](),
		description: m['lib.moderation.graphicMedia'](),
	}),
	gore: () => ({
		name: m['common.moderation.graphicMedia'](),
		description: m['lib.moderation.graphicMedia'](),
	}),
};

/**
 * returns the localized strings of a global (builtin) label value.
 *
 * @param identifier label value, e.g. `!hide` or `porn`
 * @returns the strings, or `undefined` if the value isn't a global label
 */
export const getGlobalLabelStrings = (identifier: string): GlobalLabelStrings | undefined =>
	GLOBAL_LABEL_STRINGS[identifier]?.();
