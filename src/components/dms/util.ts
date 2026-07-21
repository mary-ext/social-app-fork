import type { AnyProfileView, ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	ModerationCauseType,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import type { $type, Did } from '@atcute/lexicons';

import { EMOJI_REACTION_LIMIT } from '#/lib/constants';
import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';

import type { Shadow } from '#/state/cache/profile-shadow';
import { type ConvoState, ConvoStatus } from '#/state/messages/convo/types';

import { logger } from '#/logger';

export const MESSAGE_GAP_THRESHOLD_MS = 60 * 60 * 1000;
export const CLUSTERED_MESSAGE_THRESHOLD_MS = 5 * 60 * 1000;

export function canBeMessaged(profile: AnyProfileView) {
	switch (profile.associated?.chat?.allowIncoming) {
		case 'none':
			return false;
		case 'all':
			return true;
		// if unset, treat as following
		case 'following':
		case undefined:
			return Boolean(profile.viewer?.followedBy);
		// any other values are invalid according to the lexicon, so
		// let's treat as false to be safe
		default:
			return false;
	}
}

export function canBeAddedToGroup(profile: AnyProfileView) {
	switch (profile.associated?.chat?.allowGroupInvites) {
		case 'none':
			return false;
		case 'all':
			return true;
		case 'following':
			return Boolean(profile.viewer?.followedBy);
		case undefined:
			return canBeMessaged(profile);
		default:
			return false;
	}
}

/**
 * resolves the effective `allowGroupInvites` value for a chat declaration.
 *
 * @param chat the chat declaration to check.
 * @returns the resolved group invite preference.
 */
export function resolveAllowGroupInvites(
	chat: { allowIncoming?: string; allowGroupInvites?: string } | undefined,
): 'all' | 'following' | 'none' {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the lexicon leaves `allow*` open; we only read and write these three
	return (chat?.allowGroupInvites ?? chat?.allowIncoming ?? 'following') as 'all' | 'following' | 'none';
}

export function localDateString(date: Date) {
	// can't use toISOString because it should be in local time
	const mm = date.getMonth();
	const dd = date.getDate();
	const yyyy = date.getFullYear();
	// not padding with 0s because it's not necessary, it's just used for comparison
	return `${yyyy}-${mm}-${dd}`;
}

export function hasAlreadyReacted(
	message: ChatBskyConvoDefs.MessageView,
	myDid: string | undefined,
	emoji: string,
): boolean {
	if (!message.reactions) {
		return false;
	}
	return !!message.reactions.find((reaction) => reaction.value === emoji && reaction.sender.did === myDid);
}

/**
 * filters out reactions from blocked or blocking accounts to prevent their identities from appearing in the
 * UI. keeps reactions from unknown senders, which are rendered anonymously.
 *
 * @param reactions list of reactions to filter
 * @param relatedProfiles profile data used to check block status
 * @returns filtered list of reactions
 */
export function filterBlockedReactions(
	reactions: ChatBskyConvoDefs.ReactionView[] | undefined,
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>,
): ChatBskyConvoDefs.ReactionView[] {
	if (!reactions) return [];
	return reactions.filter((reaction) => {
		const profile = relatedProfiles.get(reaction.sender.did);
		return !profile || !isBlockedOrBlocking(profile);
	});
}

export function hasReachedReactionLimit(
	message: ChatBskyConvoDefs.MessageView,
	myDid: string | undefined,
): boolean {
	if (!message.reactions) {
		return false;
	}
	const myReactions = message.reactions.filter((reaction) => reaction.sender.did === myDid);
	return myReactions.length >= EMOJI_REACTION_LIMIT;
}

/**
 * whether the active conversation accepts emoji reactions. reactions are unavailable when the conversation is
 * disabled, locked, or when there is a block relationship with the recipient or group owner.
 */
export function canReact({
	convoState,
	primaryMember,
	moderationOpts,
}: {
	convoState: ConvoState;
	primaryMember: Shadow<AnyProfileView> | undefined;
	moderationOpts: ModerationOptions | undefined;
}): boolean {
	if (convoState.status === ConvoStatus.Disabled) {
		return false;
	}

	if (!convoState.convo) {
		return true;
	}

	if (convoState.convo.kind === 'group') {
		const { lockStatus } = convoState.convo.details;
		if (lockStatus === 'locked' || lockStatus === 'locked-permanently') {
			return false;
		}
	}

	if (primaryMember && moderationOpts) {
		const moderation = moderateProfile(primaryMember, moderationOpts);
		if (convoState.convo.kind === 'direct') {
			// either direction (blocking or blocked-by) hides reactions in 1-1s
			const isBlocked = moderation.causes.some(
				(cause) =>
					cause.type === ModerationCauseType.Blocking || cause.type === ModerationCauseType.BlockedBy,
			);
			if (isBlocked) return false;
		} else {
			// in groups, only "we are blocking" the owner hides reactions
			const isBlockingPrimary = getDisplayRestrictions(moderation, DisplayContext.ProfileView).alerts.some(
				(cause) => cause.type === ModerationCauseType.Blocking,
			);
			if (isBlockingPrimary) return false;
		}
	}

	return true;
}

export type GroupConvoMember = ChatBskyActorDefs.ProfileViewBasic & {
	// can be missing if account deleted
	kind?: $type.enforce<ChatBskyActorDefs.GroupConvoMember>;
};

export type DirectConvoMember = ChatBskyActorDefs.ProfileViewBasic & {
	kind: $type.enforce<ChatBskyActorDefs.DirectConvoMember>;
};

export type ConvoWithDetails = { view: ChatBskyConvoDefs.ConvoView } & (
	| {
			kind: 'group';
			details: $type.enforce<ChatBskyConvoDefs.GroupConvo>;
			primaryMember?: GroupConvoMember; // the owner - may have left, thus optional
			members: Array<GroupConvoMember>;
	  }
	| {
			kind: 'direct';
			details: $type.enforce<ChatBskyConvoDefs.DirectConvo>;
			primaryMember: DirectConvoMember; // the other user
			members: Array<DirectConvoMember>;
	  }
);

/**
 * Converts a raw convoView into something easier to use (i.e. extracts chat owner) and enforces the correct
 * type for convo members.
 */
export function parseConvoView(
	convoView: ChatBskyConvoDefs.ConvoView,
	ownDid: string | undefined,
): ConvoWithDetails | null {
	if (convoView.kind?.$type === 'chat.bsky.convo.defs#groupConvo') {
		let owner: GroupConvoMember | undefined = undefined;

		for (const member of convoView.members) {
			if (member.kind?.$type === 'chat.bsky.actor.defs#groupConvoMember') {
				if (member.kind.role === 'owner') {
					// narrowing `member.kind` doesn't re-type `member`, and respreading it would allocate for nothing
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the check above pins `member.kind`
					owner = member as GroupConvoMember;
				}
			} else {
				logger.warn('Expected a GroupConvoMember, got an unknown kind of member');
				return null;
			}
		}

		return {
			view: convoView,
			kind: 'group',
			details: convoView.kind,
			primaryMember: owner,
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the loop above bails unless every member is a `groupConvoMember`
			members: convoView.members as Array<GroupConvoMember>,
		};
	} else if (convoView.kind?.$type === 'chat.bsky.convo.defs#directConvo') {
		const otherUser = convoView.members.find((m) => m.did !== ownDid);

		if (!otherUser) {
			logger.warn('No other user found in direct convo');
			return null;
		}

		return {
			view: convoView,
			kind: 'direct',
			details: convoView.kind,
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a `directConvo` only holds `directConvoMember` entries
			primaryMember: otherUser as DirectConvoMember,
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a `directConvo` only holds `directConvoMember` entries
			members: convoView.members as Array<DirectConvoMember>,
		};
	} else {
		logger.warn('Unknown convo kind: ' + JSON.stringify(convoView.kind));
		return null;
	}
}

export type ReportSubject =
	| { convoId: string; did: Did }
	| { convoId: string; message: ChatBskyConvoDefs.MessageView; view: 'convo' };

/**
 * derives the moderation report subject for a conversation. groups report the group owner, while direct chats
 * report the other user's most recent message (or the user itself if no message is reportable).
 *
 * @param convo parsed conversation
 * @param ownDid the viewer's DID, used to skip the viewer's own last message
 * @returns the report subject, or null if none can be derived
 */
export function getConvoReportSubject(
	convo: ConvoWithDetails,
	ownDid: Did | undefined,
): ReportSubject | null {
	if (convo.kind === 'group') {
		if (!convo.primaryMember) {
			return null;
		}
		return { convoId: convo.view.id, did: convo.primaryMember.did };
	}

	const lastMessage = convo.view.lastMessage;
	const reportableMessage =
		lastMessage?.$type === 'chat.bsky.convo.defs#messageView' && lastMessage.sender?.did !== ownDid
			? lastMessage
			: null;

	if (reportableMessage) {
		return { convoId: convo.view.id, message: reportableMessage, view: 'convo' };
	}

	return { convoId: convo.view.id, did: convo.primaryMember.did };
}
