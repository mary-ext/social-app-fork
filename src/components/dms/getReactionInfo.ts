import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { isDidBlockedInConvo } from '#/components/dms/getMessageInfo';

import { m } from '#/paraglide/messages';

export type UserReactionInfo = {
	message: string;
	createdAt: string;
	isBlocked: boolean;
};

export function getReactionInfo({
	convo,
	currentAccountDid,
	primaryProfile,
}: {
	convo: ChatBskyConvoDefs.ConvoView;
	currentAccountDid: string | undefined;
	primaryProfile?: AnyProfileView;
}): UserReactionInfo | null {
	if (convo.lastReaction?.$type !== 'chat.bsky.convo.defs#messageAndReactionView') {
		return null;
	}

	const { reaction, message: reactedTo } = convo.lastReaction;
	const isFromMe = reaction.sender.did === currentAccountDid;
	const senderDid = reaction.sender.did;
	const sender = convo.members.find((member) => member.did === senderDid);
	const name = sender ? createSanitizedDisplayName(sender) : null;

	// Hide the preview when either the reactor or the author of the reacted-to message is blocked —
	// otherwise a blocked reactor's name or a blocked sender's message text would leak into the chat list.
	const isBlocked =
		isDidBlockedInConvo({
			did: senderDid,
			members: convo.members,
			primaryProfile,
		}) ||
		isDidBlockedInConvo({
			did: reactedTo.sender?.did,
			members: convo.members,
			primaryProfile,
		});

	const lastMessageText = reactedTo.text;
	const target = lastMessageText ? `"${lastMessageText}"` : m['components.dms.label.aMessage']();

	let message: string;
	if (isFromMe) {
		message = m['components.dms.update.youReactedTo']({ target, value: reaction.value });
	} else if (name) {
		message = m['components.dms.reaction.reactedTo']({ name, reaction: reaction.value, target });
	} else {
		message = m['components.dms.update.someoneReactedTo']({ target, value: reaction.value });
	}

	return {
		message,
		createdAt: reaction.createdAt,
		isBlocked,
	};
}
