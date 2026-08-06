import type { ComponentType, SVGProps } from 'react';

import { type ModerationCause, ModerationCauseType } from '@atcute/bluesky-moderation';

import { BSKY_LABELER_DID } from '#/lib/moderation/const';
import type { AppModerationCause } from '#/lib/moderation/types';

import { useLabelDefinitions } from '#/state/moderation/label-defs';
import { useSession } from '#/state/session';

import { LOCALE } from '#/locale/intl/locale';

import CircleBanSign from '#/icons/central/CircleBanSign_round_outlined_radius1_stroke2.svg';
import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import Warning from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import EyeSlash from '#/icons/central/EyeSlash_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useGlobalLabelStrings } from './use-global-label-strings';
import { getDefinition, getLabelStrings } from './use-label-info';

/** Provenance of a moderation cause, replacing `@atproto/api`'s `ModerationCauseSource['type']`. */
type ModerationCauseSourceType = 'labeler' | 'list' | 'user';

interface ModerationCauseDescription {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	name: string;
	description: string;
	source?: string;
	sourceDisplayName?: string;
	sourceType?: ModerationCauseSourceType;
	sourceAvi?: string;
	sourceDid?: string;
	isSubjectAccount?: boolean;
}

export function useModerationCauseDescription(
	cause: ModerationCause | AppModerationCause | undefined,
): ModerationCauseDescription {
	const { currentAccount } = useSession();
	const { labelDefs, labelers } = useLabelDefinitions();
	const globalLabelStrings = useGlobalLabelStrings();

	if (!cause) {
		return {
			icon: Warning,
			name: m['common.moderation.contentWarning'](),
			description: m['common.moderation.generalWarning'](),
		};
	}

	// fork-synthetic cause for replies hidden by the thread author (no @atcute equivalent)
	if (cause.type === 'reply-hidden') {
		const isMe = currentAccount?.did === cause.source.did;
		return {
			icon: EyeSlash,
			name: isMe ? m['common.thread.replyHiddenByYou']() : m['common.thread.replyHiddenByAuthor'](),
			description: isMe ? m['common.thread.youHidReply']() : m['common.thread.authorHiddenReply'](),
		};
	}

	switch (cause.type) {
		case ModerationCauseType.Blocking: {
			if (cause.source) {
				return {
					icon: CircleBanSign,
					name: m['lib.moderation.blockedBy']({ name: cause.source.name }),
					description: m['common.block.byYou.message'](),
				};
			}
			return {
				icon: CircleBanSign,
				name: m['common.block.byYou.title'](),
				description: m['common.block.byYou.message'](),
			};
		}
		case ModerationCauseType.BlockedBy: {
			return {
				icon: CircleBanSign,
				name: m['lib.moderation.blockingYou'](),
				description: m['common.block.blocksYou.message'](),
			};
		}
		case ModerationCauseType.MutedPermanent: {
			if (cause.source) {
				return {
					icon: EyeSlash,
					name: m['lib.moderation.mutedBy']({ name: cause.source.name }),
					description: m['lib.moderation.youMuted'](),
				};
			}
			return {
				icon: EyeSlash,
				name: m['common.mute.byYou.title'](),
				description: m['common.mute.byYou.message'](),
			};
		}
		case ModerationCauseType.MutedTemporary: {
			return {
				icon: EyeSlash,
				name: m['common.mute.byYou.title'](),
				description: m['common.mute.byYou.message'](),
			};
		}
		case ModerationCauseType.MutedKeyword: {
			return {
				icon: EyeSlash,
				name: m['common.mutedWord.postHidden'](),
				description: m['common.mutedWord.hiddenTag'](),
			};
		}
		case ModerationCauseType.Hidden: {
			return {
				icon: EyeSlash,
				name: m['common.thread.postHiddenByYou'](),
				description: m['common.thread.youHidPost'](),
			};
		}
		case ModerationCauseType.Label: {
			const def = cause.labelDef || getDefinition(labelDefs, cause.label);
			const strings = getLabelStrings(LOCALE, globalLabelStrings, def);
			const labeler = labelers.find((l) => l.creator.did === cause.label.src);
			let source = labeler ? `@${labeler.creator.handle}` : undefined;
			let sourceDisplayName = labeler?.creator.displayName;
			if (!source) {
				if (cause.label.src === BSKY_LABELER_DID) {
					source = 'moderation.bsky.app';
					sourceDisplayName = 'Bluesky Moderation Service';
				} else {
					source = m['common.moderation.unknownLabeler']();
				}
			}
			if (def.identifier === 'porn' || def.identifier === 'sexual') {
				strings.name = m['common.moderation.adultContent']();
			}

			return {
				icon:
					def.identifier === '!no-unauthenticated'
						? EyeSlash
						: def.severity === 'alert'
							? Warning
							: CircleInfo,
				name: strings.name,
				description: strings.description,
				source,
				sourceDisplayName,
				sourceType: cause.source === null ? 'user' : 'labeler',
				sourceAvi: labeler?.creator.avatar,
				sourceDid: cause.label.src,
				isSubjectAccount: cause.label.uri.startsWith('did:'),
			};
		}
		default: {
			// should never happen
			return {
				icon: CircleInfo,
				name: '',
				description: ``,
			};
		}
	}
}
