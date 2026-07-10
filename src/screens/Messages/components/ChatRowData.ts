import type { ComponentType } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import {
	type BlockingModerationCause,
	ModerationCauseType,
	type ModerationDecision,
} from '@atcute/bluesky-moderation';

import { useQueryClient } from '@tanstack/react-query';

import type { Shadow } from '#/state/cache/profile-shadow';
import { precacheConvoQuery } from '#/state/queries/messages/conversation';
import { unstableCacheProfileView } from '#/state/queries/profile';

import { getMessageInfo } from '#/components/dms/getMessageInfo';
import { getReactionInfo } from '#/components/dms/getReactionInfo';
import { getSystemMessageInfo } from '#/components/dms/getSystemMessageInfo';
import type { ConvoWithDetails } from '#/components/dms/util';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { Lock_Stroke2_Corner2_Rounded as LockIcon } from '#/components/icons/Lock';

import { m } from '#/paraglide/messages';

/**
 * returns a callback that seeds the query cache with the conversation and its members, so opening the row
 * renders the conversation screen without a fetch.
 */
export function usePrecacheConvo(convo: ConvoWithDetails) {
	const queryClient = useQueryClient();
	return () => {
		for (const member of convo.view.members) {
			unstableCacheProfileView(queryClient, member);
		}
		precacheConvoQuery(queryClient, convo.view);
	};
}

export type BlockInfo = {
	listBlocks: BlockingModerationCause[];
	userBlock: BlockingModerationCause | undefined;
};

/** splits a profile's blocking causes into list-sourced blocks and a direct user block, for {@link ConvoMenu}. */
export function getBlockInfo(moderation: ModerationDecision | undefined): BlockInfo {
	if (!moderation) {
		return { listBlocks: [], userBlock: undefined };
	}
	const blocks = moderation.causes.filter(
		(cause): cause is BlockingModerationCause => cause.type === ModerationCauseType.Blocking,
	);
	return {
		listBlocks: blocks.filter((block) => block.source !== null),
		userBlock: blocks.find((block) => block.source === null),
	};
}

/** true when the profile is blocking or blocked by the current user. */
export function isBlockedAccount(moderation: ModerationDecision): boolean {
	return moderation.causes.some(
		(c) => c.type === ModerationCauseType.Blocking || c.type === ModerationCauseType.BlockedBy,
	);
}

/**
 * whether the row should render its unread affordances (bold text, dot). a selected row is already the one
 * being read, and a locked group can't be read at all.
 */
export function hasUnread(
	convo: ConvoWithDetails,
	{ isDeletedAccount, selected }: { isDeletedAccount: boolean; selected: boolean },
): boolean {
	if (selected || isDeletedAccount) {
		return false;
	}
	if (convo.kind === 'group') {
		return (
			convo.details.lockStatus === 'unlocked' &&
			(convo.view.unreadCount > 0 || (convo.details.unreadJoinRequestCount ?? 0) > 0)
		);
	}
	return convo.view.unreadCount > 0;
}

/** whether the row's text is muted: a conversation the user can't or won't engage with. */
export function isDimmed(
	convo: ConvoWithDetails,
	{ blocked, isDeletedAccount }: { blocked: boolean; isDeletedAccount: boolean },
): boolean {
	return (
		convo.view.muted ||
		blocked ||
		isDeletedAccount ||
		(convo.kind === 'group' && convo.details.lockStatus !== 'unlocked')
	);
}

export type LastMessagePreview = {
	/** leading glyph for a system message or a locked group; `null` for an ordinary message. */
	Icon: ComponentType<SVGIconProps> | null;
	/** timestamp of whatever is being previewed, or `null` when the conversation is empty. */
	sentAt: string | null;
	text: string;
};

/**
 * resolves the one-line preview shown under a conversation's title, picking the most recent of the last
 * message and the last reaction.
 */
export function getLastMessagePreview({
	convo,
	currentAccountDid,
	isDeletedAccount,
	primaryProfile,
}: {
	convo: ConvoWithDetails;
	currentAccountDid: string | undefined;
	isDeletedAccount: boolean;
	primaryProfile: Shadow<AnyProfileView> | undefined;
}): LastMessagePreview {
	let Icon: LastMessagePreview['Icon'] = null;
	let sentAt: string | null = null;
	let text: string = m['screens.messages.conversation.noMessages']();

	const lastMessage = convo.view.lastMessage;
	switch (lastMessage?.$type) {
		case 'chat.bsky.convo.defs#deletedMessageView': {
			sentAt = lastMessage.sentAt;
			text = isDeletedAccount
				? m['components.dms.delete.conversationDeleted']()
				: m['components.dms.delete.messageDeleted']();
			break;
		}
		case 'chat.bsky.convo.defs#messageView': {
			const info = getMessageInfo({ convo: convo.view, currentAccountDid, primaryProfile });
			if (info) {
				text = info.isBlockedMessage
					? m['screens.messages.moderation.messageHidden']()
					: (info.message ?? text);
				sentAt = info.sentAt;
			}
			break;
		}
		case 'chat.bsky.convo.defs#systemMessageView': {
			const info = getSystemMessageInfo(
				lastMessage.data,
				new Map(convo.view.members.map((member) => [member.did, member])),
				{ short: true },
			);
			if (info) {
				Icon = info.Icon;
				sentAt = lastMessage.sentAt;
				text = info.message;
			}
			break;
		}
	}

	// a reaction newer than the last message takes over the preview
	if (convo.view.lastReaction?.$type === 'chat.bsky.convo.defs#messageAndReactionView') {
		const info = getReactionInfo({ convo: convo.view, currentAccountDid, primaryProfile });
		if (info && !info.isBlocked && (!sentAt || new Date(sentAt) < new Date(info.createdAt))) {
			Icon = null;
			sentAt = info.createdAt;
			text = info.message;
		}
	}

	// a locked group says why it's locked instead of what was last said in it, but keeps the timestamp
	if (convo.kind === 'group' && convo.details.lockStatus !== 'unlocked') {
		return { Icon: LockIcon, sentAt, text: m['screens.messages.lock.chatLocked']() };
	}

	return { Icon, sentAt, text };
}
