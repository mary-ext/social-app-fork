import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { MessageDescriptor } from '@lingui/core';
import { defineMessage } from '@lingui/core/macro';

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

export type SystemMessageAction =
	| {
			kind: 'profile';
			profile: ChatBskyActorDefs.ProfileViewBasic;
			displayName: string;
	  }
	| { kind: 'inviteLink' };

export type SystemMessageInfo = {
	message: MessageDescriptor;
	Icon: React.ComponentType<SVGIconProps>;
	action?: SystemMessageAction;
};

function getProfileAction(
	user: ChatBskyConvoDefs.SystemMessageReferredUser,
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>,
): Extract<SystemMessageAction, { kind: 'profile' }> | null {
	const profile = relatedProfiles.get(user.did);
	if (!profile) return null;
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
						? defineMessage`${action.displayName} was added`
						: defineMessage`${action.displayName} was added to the group`
					: opts.short
						? defineMessage`Someone was added`
						: defineMessage`Someone was added to the group`,
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataRemoveMember': {
			const action = getProfileAction(data.member, relatedProfiles);
			return {
				Icon: LeaveIcon,
				message: action
					? opts.short
						? defineMessage`${action.displayName} was removed`
						: defineMessage`${action.displayName} was removed from the group`
					: opts.short
						? defineMessage`Someone was removed`
						: defineMessage`Someone was removed from the group`,
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataMemberJoin': {
			const action = getProfileAction(data.member, relatedProfiles);
			return {
				Icon: JoinIcon,
				message: action
					? opts.short
						? defineMessage`${action.displayName} joined`
						: defineMessage`${action.displayName} joined the group`
					: opts.short
						? defineMessage`Someone joined`
						: defineMessage`Someone joined the group`,
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataMemberLeave': {
			const action = getProfileAction(data.member, relatedProfiles);
			return {
				Icon: LeaveIcon,
				message: action
					? opts.short
						? defineMessage`${action.displayName} left`
						: defineMessage`${action.displayName} left the group`
					: opts.short
						? defineMessage`Someone left`
						: defineMessage`Someone left the group`,
				action: action ?? undefined,
			};
		}
		case 'chat.bsky.convo.defs#systemMessageDataLockConvo':
			return { Icon: LockIcon, message: defineMessage`Chat locked` };
		case 'chat.bsky.convo.defs#systemMessageDataUnlockConvo':
			return { Icon: UnlockIcon, message: defineMessage`Chat unlocked` };
		case 'chat.bsky.convo.defs#systemMessageDataLockConvoPermanently':
			return { Icon: LockIcon, message: defineMessage`Chat ended` };
		case 'chat.bsky.convo.defs#systemMessageDataEditGroup':
			return {
				Icon: PencilIcon,
				message:
					data.newName && !opts.short
						? defineMessage`Chat title changed to ${data.newName}`
						: defineMessage`Chat title changed`,
			};
		case 'chat.bsky.convo.defs#systemMessageDataCreateJoinLink':
			return {
				Icon: ChainLinkIcon,
				message: defineMessage`Invite link created`,
				action: { kind: 'inviteLink' },
			};
		case 'chat.bsky.convo.defs#systemMessageDataEditJoinLink':
			return {
				Icon: ChainLinkIcon,
				message: defineMessage`Invite link edited`,
				action: { kind: 'inviteLink' },
			};
		case 'chat.bsky.convo.defs#systemMessageDataEnableJoinLink':
			return {
				Icon: ChainLinkIcon,
				message: defineMessage`Invite link enabled`,
				action: { kind: 'inviteLink' },
			};
		case 'chat.bsky.convo.defs#systemMessageDataDisableJoinLink':
			return {
				Icon: ChainLinkBrokenIcon,
				message: defineMessage`Invite link disabled`,
				action: { kind: 'inviteLink' },
			};
	}
	return null;
}
