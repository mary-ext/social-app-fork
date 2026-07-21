import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon } from '#/components/icons/ArrowBoxLeft';
import { ArrowBoxRight_Stroke2_Corner3_Rounded as JoinIcon } from '#/components/icons/ArrowBoxRight';
import {
	ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon,
	ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon,
} from '#/components/icons/ChainLink';
import type { Props as SVGIconProps } from '#/components/icons/common';
import {
	Lock_Stroke2_Corner0_Rounded as LockIcon,
	Unlock_Stroke2_Corner2_Rounded as UnlockIcon,
} from '#/components/icons/Lock';
import { PencilLine_Stroke2_Corner0_Rounded as PencilIcon } from '#/components/icons/Pencil';

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
	Icon: React.ComponentType<SVGIconProps>;
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
		displayName: createSanitizedDisplayName(profile),
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
