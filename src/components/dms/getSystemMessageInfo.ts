import type { ComponentType, SVGProps } from 'react';

import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';

import { profileDisplayName } from '#/lib/display-names';

import LeaveIcon from '#/icons/central/ArrowBoxLeft_round_outlined_radius1_stroke2.svg';
import JoinIcon from '#/icons/central/ArrowBoxRight_round_outlined_radius1_stroke2.svg';
import ChainLinkBrokenIcon from '#/icons/central/BrokenChainLink3_round_outlined_radius1_stroke2.svg';
import ChainLinkIcon from '#/icons/central/ChainLink3_round_outlined_radius1_stroke2.svg';
import LockIcon from '#/icons/central/Lock_round_outlined_radius1_stroke2.svg';
import PencilIcon from '#/icons/central/PencilLine_round_outlined_radius1_stroke2.svg';
import UnlockIcon from '#/icons/central/Unlocked_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export type SystemMessageAction =
	| {
			kind: 'profile';
			profile: ChatBskyActorDefs.ProfileViewBasic;
			displayName: string;
	  }
	| { kind: 'inviteLink' };

export type SystemMessageInfo = {
	message: string;
	Icon: ComponentType<SVGProps<SVGSVGElement>>;
	action?: SystemMessageAction;
};

function getProfileAction(
	user: ChatBskyConvoDefs.SystemMessageReferredUser,
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>,
): Extract<SystemMessageAction, { kind: 'profile' }> | null {
	const profile = relatedProfiles.get(user.did);
	if (!profile) {
		return null;
	}
	return {
		kind: 'profile',
		profile,
		displayName: profileDisplayName(profile),
	};
}

export function getSystemMessageInfo(
	data: ChatBskyConvoDefs.SystemMessageView['data'],
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>,
	opts = { short: false },
): SystemMessageInfo | null {
	switch (data.$type) {
		case 'chat.bsky.convo.defs#systemMessageDataAddMember': {
			const action = getProfileAction(data.member, relatedProfiles);
			return {
				Icon: JoinIcon,
				message: action
					? opts.short
						? m['components.dms.update.added']({ name: action.displayName })
						: m['components.dms.update.addedToGroup']({ name: action.displayName })
					: opts.short
						? m['components.dms.update.someoneAdded']()
						: m['components.dms.update.someoneAddedToGroup'](),
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataRemoveMember': {
			const action = getProfileAction(data.member, relatedProfiles);
			return {
				Icon: LeaveIcon,
				message: action
					? opts.short
						? m['components.dms.update.removed']({ name: action.displayName })
						: m['components.dms.update.removedFromGroup']({ name: action.displayName })
					: opts.short
						? m['components.dms.update.someoneRemoved']()
						: m['components.dms.update.someoneRemovedFromGroup'](),
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataMemberJoin': {
			const action = getProfileAction(data.member, relatedProfiles);
			return {
				Icon: JoinIcon,
				message: action
					? opts.short
						? m['components.dms.update.joined']({ name: action.displayName })
						: m['components.dms.update.joinedGroup']({ name: action.displayName })
					: opts.short
						? m['components.dms.update.someoneJoined']()
						: m['components.dms.update.someoneJoinedGroup'](),
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataMemberLeave': {
			const action = getProfileAction(data.member, relatedProfiles);
			return {
				Icon: LeaveIcon,
				message: action
					? opts.short
						? m['components.dms.update.left']({ name: action.displayName })
						: m['components.dms.update.leftGroup']({ name: action.displayName })
					: opts.short
						? m['components.dms.update.someoneLeft']()
						: m['components.dms.update.someoneLeftGroup'](),
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataLockConvo':
			return { Icon: LockIcon, message: m['components.dms.update.chatLocked']() };
		case 'chat.bsky.convo.defs#systemMessageDataUnlockConvo':
			return { Icon: UnlockIcon, message: m['components.dms.update.chatUnlocked']() };
		case 'chat.bsky.convo.defs#systemMessageDataLockConvoPermanently':
			return { Icon: LockIcon, message: m['components.dms.update.chatEnded']() };
		case 'chat.bsky.convo.defs#systemMessageDataEditGroup':
			return {
				Icon: PencilIcon,
				message:
					data.newName && !opts.short
						? m['components.dms.update.titleChangedTo']({ name: data.newName })
						: m['components.dms.update.titleChanged'](),
			};
		case 'chat.bsky.convo.defs#systemMessageDataCreateJoinLink':
			return {
				Icon: ChainLinkIcon,
				message: m['components.dms.invite.created'](),
				action: { kind: 'inviteLink' },
			};
		case 'chat.bsky.convo.defs#systemMessageDataEditJoinLink':
			return {
				Icon: ChainLinkIcon,
				message: m['components.dms.invite.edited'](),
				action: { kind: 'inviteLink' },
			};
		case 'chat.bsky.convo.defs#systemMessageDataEnableJoinLink':
			return {
				Icon: ChainLinkIcon,
				message: m['components.dms.invite.enabled'](),
				action: { kind: 'inviteLink' },
			};
		case 'chat.bsky.convo.defs#systemMessageDataDisableJoinLink':
			return {
				Icon: ChainLinkBrokenIcon,
				message: m['common.chat.inviteLinkDisabled'](),
				action: { kind: 'inviteLink' },
			};
	}
	return null;
}
