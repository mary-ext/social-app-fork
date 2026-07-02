import { type ModerationCause, ModerationCauseType } from '@atcute/bluesky-moderation';

import { BSKY_LABELER_DID } from '#/lib/moderation/const';

import { useLabelDefinitions } from '#/state/preferences';
import { useSession } from '#/state/session';

import { LOCALE } from '#/locale/intl/locale';

import { CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign } from '#/components/icons/CircleBanSign';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { Warning_Stroke2_Corner0_Rounded as Warning } from '#/components/icons/Warning';
import type { AppModerationCause } from '#/components/Pills';

import { m } from '#/paraglide/messages';

import { useGlobalLabelStrings } from './useGlobalLabelStrings';
import { getDefinition, getLabelStrings } from './useLabelInfo';

/** Provenance of a moderation cause, replacing `@atproto/api`'s `ModerationCauseSource['type']`. */
export type ModerationCauseSourceType = 'labeler' | 'list' | 'user';

export interface ModerationCauseDescription {
	icon: React.ComponentType<SVGIconProps>;
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
