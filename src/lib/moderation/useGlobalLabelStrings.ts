import { m } from '#/paraglide/messages';

export type GlobalLabelStrings = Record<
	string,
	{
		name: string;
		description: string;
	}
>;

export function useGlobalLabelStrings(): GlobalLabelStrings {
	return {
		'!hide': {
			name: m['lib.moderation.contentBlocked'](),
			description: m['lib.moderation.hiddenByModerators'](),
		},
		'!warn': {
			name: m['common.label.contentWarning'](),
			description: m['lib.moderation.generalWarning'](),
		},
		'!no-unauthenticated': {
			name: m['common.dialog.signInRequiredTitle'](),
			description: m['lib.moderation.signedInOnly'](),
		},
		porn: {
			name: m['common.label.adultContent'](),
			description: m['lib.moderation.explicitSexual'](),
		},
		sexual: {
			name: m['lib.moderation.sexuallySuggestive'](),
			description: m['lib.moderation.noNudity'](),
		},
		nudity: {
			name: m['lib.moderation.nonSexualNudity'](),
			description: m['lib.moderation.artisticNudesExample'](),
		},
		'graphic-media': {
			name: m['common.label.graphicMedia'](),
			description: m['lib.moderation.graphicMedia'](),
		},
		gore: {
			name: m['common.label.graphicMedia'](),
			description: m['lib.moderation.graphicMedia'](),
		},
	};
}
