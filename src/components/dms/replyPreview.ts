import type { ChatBskyConvoDefs } from '@atcute/bluesky';

import { toShortUrl } from '#/lib/strings/url-helpers';

import { m } from '#/paraglide/messages';

/**
 * Computes the preview text for a message quoted in a reply, shared between the staged-reply composer and the
 * sent reply bubble so the two stay in sync. When the message has its own text we use it verbatim; otherwise
 * we summarize its embed — the join link, the shared external link, or the quoted post.
 *
 * @param message the message being quoted
 * @returns the preview `text` and whether it is `subtle` (a placeholder rather than real message content, so
 *   callers can render it muted/italic)
 */
export function getReplyPreviewText(message: ChatBskyConvoDefs.MessageView): {
	subtle: boolean;
	text: string;
} {
	const text = message.text;
	if (text.trim()) {
		return { subtle: false, text };
	}

	if (message.embed?.$type === 'chat.bsky.embed.joinLink#view') {
		const { joinLinkPreview } = message.embed;
		switch (joinLinkPreview.$type) {
			case 'chat.bsky.group.defs#joinLinkPreviewView':
				return { subtle: true, text: 'https://bsky.app/chat/' + joinLinkPreview.code };
			case 'chat.bsky.group.defs#disabledJoinLinkPreviewView':
				return { subtle: true, text: m['common.chat.inviteLinkDisabled']() };
			case 'chat.bsky.group.defs#invalidJoinLinkPreviewView':
				return { subtle: true, text: m['common.chat.inviteLinkInvalid']() };
			default:
				return { subtle: true, text: m['common.chat.inviteLink']() };
		}
	}

	if (message.embed?.$type === 'app.bsky.embed.record#view') {
		const { record } = message.embed;
		if (record.$type === 'app.bsky.embed.record#viewRecord') {
			const inner = record.embeds?.[0];
			if (inner?.$type === 'app.bsky.embed.external#view') {
				return { subtle: true, text: toShortUrl(inner.external.uri) };
			}
			return { subtle: true, text: m['common.embed.quotedPost']() };
		}
	}

	return { subtle: true, text: m['common.altText.noText']() };
}
