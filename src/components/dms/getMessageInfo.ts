import type { AnyProfileView, ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';

import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { postUriToRelativePath, toBskyAppUrl, toShortUrl } from '#/lib/strings/url-helpers';

import { m } from '#/paraglide/messages';

export type UserMessageInfo = {
	message: string | null;
	sentAt: string;
	reportableMessage?: ChatBskyConvoDefs.MessageView;
	isBlockedMessage: boolean;
};

/**
 * Resolves whether the given did is blocked (in either direction) within a convo. Prefers the passed-in
 * shadowed `primaryProfile` so optimistic blocks reflect immediately, before the convo list refetches - the
 * raw `members` fetched with the convo are invisible to the profile shadow cache. Group members other than
 * the owner fall back to the raw (potentially stale) member.
 */
export function isDidBlockedInConvo({
	did,
	members,
	primaryProfile,
}: {
	did: string | undefined;
	members: ChatBskyActorDefs.ProfileViewBasic[];
	primaryProfile?: AnyProfileView;
}): boolean {
	if (!did) return false;
	if (primaryProfile && primaryProfile.did === did) {
		return !!isBlockedOrBlocking(primaryProfile);
	}
	const member = members.find((m) => m.did === did);
	return member ? !!isBlockedOrBlocking(member) : false;
}

export function getMessageInfo({
	convo,
	currentAccountDid,
	primaryProfile,
}: {
	convo: ChatBskyConvoDefs.ConvoView;
	currentAccountDid: string | undefined;
	primaryProfile?: AnyProfileView;
}): UserMessageInfo | null {
	if (convo.lastMessage?.$type !== 'chat.bsky.convo.defs#messageView') {
		return null;
	}

	const lastMessage = convo.lastMessage;
	const isFromMe = lastMessage.sender?.did === currentAccountDid;
	const senderDid = lastMessage.sender?.did;
	const sender = convo.members.find((m) => m.did === senderDid);
	const name = sender ? createSanitizedDisplayName(sender) : null;
	const isGroup = convo.kind?.$type === 'chat.bsky.convo.defs#groupConvo';

	const reportableMessage = isFromMe ? undefined : lastMessage;
	const isBlockedMessage = isDidBlockedInConvo({
		did: senderDid,
		members: convo.members,
		primaryProfile,
	});

	const prefix = (message: string) => {
		if (isFromMe) {
			return m['components.dms.label.lastMessageByYou']({ message });
		} else if (isGroup && name) {
			return m['components.dms.label.namedMessage']({ message, name });
		}
		return message;
	};

	let message: string | null = null;

	if (lastMessage.text) {
		message = prefix(lastMessage.text);
	} else if (lastMessage.embed) {
		const defaultEmbeddedContentMessage = m['common.label.embeddedContent']();

		if (lastMessage.embed.$type === 'app.bsky.embed.record#view') {
			const embed = lastMessage.embed;

			if (embed.record.$type === 'app.bsky.embed.record#viewRecord') {
				const record = embed.record;
				const path = postUriToRelativePath(record.uri);
				const href = path ? toBskyAppUrl(path) : undefined;
				const short = href ? toShortUrl(href) : defaultEmbeddedContentMessage;
				message = prefix(short);
			} else {
				message = prefix(defaultEmbeddedContentMessage);
			}
		} else if (lastMessage.embed.$type === 'chat.bsky.embed.joinLink#view') {
			message = prefix(m['common.label.chatInviteLink']());
		} else {
			message = prefix(defaultEmbeddedContentMessage);
		}
	}

	return {
		message,
		sentAt: lastMessage.sentAt,
		reportableMessage,
		isBlockedMessage,
	};
}
