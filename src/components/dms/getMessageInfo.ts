import { type ChatBskyConvoDefs } from '@atcute/bluesky';
import { type I18n } from '@lingui/core';
import { defineMessage } from '@lingui/core/macro';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { postUriToRelativePath, toBskyAppUrl, toShortUrl } from '#/lib/strings/url-helpers';

export type UserMessageInfo = {
	message: string | null;
	sentAt: string;
	reportableMessage?: ChatBskyConvoDefs.MessageView;
};

export function getMessageInfo({
	convo,
	currentAccountDid,
	i18n,
}: {
	convo: ChatBskyConvoDefs.ConvoView;
	currentAccountDid: string | undefined;
	i18n: I18n;
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

	const prefix = (message: string) => {
		if (isFromMe) {
			return i18n._(
				defineMessage({
					message: `You: ${message}`,
					comment: 'When the last message in a chat was made by you.',
				}),
			);
		} else if (isGroup && name) {
			return i18n._(
				defineMessage({
					message: `${name}: ${message}`,
					comment: 'When the last message in a group chat came from someone other than you.',
				}),
			);
		}
		return message;
	};

	let message: string | null = null;

	if (lastMessage.text) {
		message = prefix(lastMessage.text);
	} else if (lastMessage.embed) {
		const defaultEmbeddedContentMessage = i18n._(defineMessage`(contains embedded content)`);

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
		} else {
			message = prefix(defaultEmbeddedContentMessage);
		}
	}

	return {
		message,
		sentAt: lastMessage.sentAt,
		reportableMessage,
	};
}
