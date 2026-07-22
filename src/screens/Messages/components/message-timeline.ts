import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';

import type { ConvoItem } from '#/state/messages/convo/types';

import { isOnlyEmoji } from '#/alf/typography';

import {
	CLUSTERED_MESSAGE_THRESHOLD_MS,
	filterBlockedReactions,
	localDateString,
	MESSAGE_GAP_THRESHOLD_MS,
} from '#/components/dms/util';

export type SystemMessageItem = Extract<ConvoItem, { type: 'system-message' }>;

export type SystemMessageGroupItem = {
	type: 'system-message-group';
	key: string;
	items: SystemMessageItem[];
};

export type SystemMessageDateDividerItem = {
	type: 'system-message-date-divider';
	key: string;
	sentAt: string;
};

/**
 * a message row with its cluster/corner presentation precomputed from neighbors, so message rows don't peek
 * at their siblings during render.
 */
export type MessageListItem = {
	type: 'message' | 'pending-message';
	key: string;
	convoItem: Extract<ConvoItem, { type: 'message' | 'pending-message' }>;
	/** a date divider precedes this row (first of a new day/gap). */
	hasLargeGapFromPrev: boolean;
	/** first message of a same-sender cluster (gets top spacing + name/avatar anchors). */
	isFirstInCluster: boolean;
	/** last message of a same-sender cluster (anchors the avatar and metadata). */
	isLastInCluster: boolean;
	/** square the inner bottom corner so the bubble butts against the message below. */
	squaredBottomCorner: boolean;
	/** square the inner top corner so the bubble butts against the message above. */
	squaredTopCorner: boolean;
};

export type RenderItem =
	| Extract<ConvoItem, { type: 'deleted-message' | 'error' | 'system-message' }>
	| MessageListItem
	| SystemMessageDateDividerItem
	| SystemMessageGroupItem;

type BaseItem = ConvoItem | SystemMessageDateDividerItem | SystemMessageGroupItem;

type NeighborMessage = ChatBskyConvoDefs.DeletedMessageView | ChatBskyConvoDefs.MessageView | null;

function getSentAt(item: ConvoItem): string | null {
	if (
		item.type === 'message' ||
		item.type === 'pending-message' ||
		item.type === 'deleted-message' ||
		item.type === 'system-message'
	) {
		return item.message.sentAt;
	}
	return null;
}

function messageIsReply(message: NeighborMessage): boolean {
	return (
		message?.$type === 'chat.bsky.convo.defs#messageView' &&
		(message.replyTo?.$type === 'chat.bsky.convo.defs#messageView' ||
			message.replyTo?.$type === 'chat.bsky.convo.defs#deletedMessageView' ||
			message.replyTo?.$type === 'chat.bsky.convo.defs#messageBeforeUserJoinedGroupView')
	);
}

function isWithinClusterBoundary({
	isPending,
	message,
	adjacentMessage,
	isFromSameSender,
	direction,
}: {
	isPending: boolean;
	message: ChatBskyConvoDefs.MessageView;
	adjacentMessage: NeighborMessage;
	isFromSameSender: boolean;
	direction: 'prev' | 'next';
}): boolean {
	// A reply always starts its own cluster, breaking grouping with the message
	// above it. Looking back, that's a boundary if this message is a reply;
	// looking forward, it's a boundary if the next message is a reply.
	if (messageIsReply(direction === 'prev' ? message : adjacentMessage)) {
		return true;
	}
	if (!isFromSameSender) {
		return true;
	}
	if (adjacentMessage?.$type === 'chat.bsky.convo.defs#messageView') {
		const currentSentAt = message.sentAt;
		const thisDate = new Date(currentSentAt);
		const adjDate = new Date(adjacentMessage.sentAt);
		const diff =
			direction === 'next' ? adjDate.getTime() - thisDate.getTime() : thisDate.getTime() - adjDate.getTime();
		const isOutsideThreshold = diff > CLUSTERED_MESSAGE_THRESHOLD_MS;
		if (isPending) {
			return isOutsideThreshold;
		}
		return isOutsideThreshold;
	}
	return true;
}

/** the adjacent message/deleted-message view for cluster math, or null for non-message neighbors. */
function neighborMessage(items: BaseItem[], index: number): NeighborMessage {
	const neighbor = items[index];
	if (!neighbor) {
		return null;
	}
	if (
		neighbor.type === 'message' ||
		neighbor.type === 'pending-message' ||
		neighbor.type === 'deleted-message'
	) {
		if (
			neighbor.message.$type === 'chat.bsky.convo.defs#messageView' ||
			neighbor.message.$type === 'chat.bsky.convo.defs#deletedMessageView'
		) {
			return neighbor.message;
		}
	}
	return null;
}

/** groups runs of consecutive system messages, emitting a date divider before a run that opens a new day/gap. */
function groupSystemMessages(items: ConvoItem[]): BaseItem[] {
	const result: BaseItem[] = [];
	let run: SystemMessageItem[] = [];
	let lastSentAt: string | null = null;
	let runAnchor: string | null = null;

	const flush = () => {
		if (run.length === 0) {
			return;
		}

		const firstSentAt = run[0]!.message.sentAt;
		const hasLargeGap =
			runAnchor === null ||
			new Date(firstSentAt).getTime() - new Date(runAnchor).getTime() > MESSAGE_GAP_THRESHOLD_MS;

		if (hasLargeGap) {
			result.push({
				key: `system-message-date-divider:${run[0]!.key}`,
				sentAt: firstSentAt,
				type: 'system-message-date-divider',
			});
		}

		if (run.length < 4) {
			for (const item of run) {
				result.push(item);
			}
		} else {
			// Key off the first member's id so the key stays stable when a new
			// system message arrives at the end of the run (the common case).
			// Trade-off: If older history pagination prepends a system message
			// that extends the run backward, the first member changes and this
			// group collapses.
			result.push({
				items: run,
				key: `system-message-group:${run[0]!.key}`,
				type: 'system-message-group',
			});
		}
		run = [];
	};

	for (const item of items) {
		if (item.type === 'system-message') {
			const day = localDateString(new Date(item.message.sentAt));
			const lastDay = run.length > 0 ? localDateString(new Date(run[run.length - 1]!.message.sentAt)) : null;
			if (lastDay !== null && lastDay !== day) {
				flush();
			}
			if (run.length === 0) {
				runAnchor = lastSentAt;
			}
			run.push(item);
		} else {
			flush();
			result.push(item);
		}

		const sentAt = getSentAt(item);
		if (sentAt) {
			lastSentAt = sentAt;
		}
	}
	flush();

	return result;
}

/**
 * builds the flat render timeline for a conversation: groups runs of system messages, and annotates each
 * message row with the cluster/corner/divider presentation derived from its neighbors.
 *
 * @param items the conversation items in chronological order.
 * @param relatedProfiles profile data used to filter blocked reactions (which affect corner squaring).
 * @returns the render timeline, with message rows carrying precomputed presentation flags.
 */
export function buildMessageTimeline(
	items: ConvoItem[],
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>,
): RenderItem[] {
	const base = groupSystemMessages(items);
	const result: RenderItem[] = [];

	for (let i = 0; i < base.length; i++) {
		const entry = base[i]!;

		if (entry.type !== 'message' && entry.type !== 'pending-message') {
			result.push(entry);
			continue;
		}

		const message = entry.message;
		const isPending = entry.type === 'pending-message';
		const prevMessage = neighborMessage(base, i - 1);
		const nextMessage = neighborMessage(base, i + 1);

		const prevIsMessage = prevMessage?.$type === 'chat.bsky.convo.defs#messageView';
		const nextIsMessage = nextMessage?.$type === 'chat.bsky.convo.defs#messageView';

		const isPrevFromSameSender =
			prevIsMessage && prevMessage.sender?.did === message.sender?.did && message.sender?.did != null;
		const isNextFromSameSender =
			nextIsMessage && nextMessage.sender?.did === message.sender?.did && message.sender?.did != null;

		const isFirstInCluster = isWithinClusterBoundary({
			isPending,
			message,
			adjacentMessage: prevMessage,
			isFromSameSender: isPrevFromSameSender,
			direction: 'prev',
		});
		const isLastInCluster = isWithinClusterBoundary({
			isPending,
			message,
			adjacentMessage: nextMessage,
			isFromSameSender: isNextFromSameSender,
			direction: 'next',
		});

		const isInCluster = !(isFirstInCluster && isLastInCluster);
		const isInMiddleOfCluster = isInCluster && !isFirstInCluster && !isLastInCluster;

		const hasReactions = filterBlockedReactions(message.reactions, relatedProfiles).length > 0;
		const prevHasReactions =
			prevIsMessage && filterBlockedReactions(prevMessage.reactions, relatedProfiles).length > 0;
		const isNextEmojiOnly = nextIsMessage && isOnlyEmoji(nextMessage.text);
		const isPrevEmojiOnly = prevIsMessage && isOnlyEmoji(prevMessage.text);

		const squaredBottomCorner =
			!hasReactions && !isNextEmojiOnly && isInCluster && (isInMiddleOfCluster || isFirstInCluster);
		const squaredTopCorner =
			!prevHasReactions && !isPrevEmojiOnly && isInCluster && (isInMiddleOfCluster || isLastInCluster);

		const hasLargeGapFromPrev =
			prevMessage?.$type !== 'chat.bsky.convo.defs#messageView' ||
			new Date(message.sentAt).getTime() - new Date(prevMessage.sentAt).getTime() > MESSAGE_GAP_THRESHOLD_MS;

		result.push({
			convoItem: entry,
			hasLargeGapFromPrev,
			isFirstInCluster,
			isLastInCluster,
			key: entry.key,
			squaredBottomCorner,
			squaredTopCorner,
			type: entry.type,
		});
	}

	return result;
}
