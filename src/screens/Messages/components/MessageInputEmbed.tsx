import { useState } from 'react';

import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri, type ResourceUri } from '@atcute/lexicons/syntax';

import { clsx } from 'clsx';

import { getPostRecord } from '#/lib/api/record-views';
import { makeProfileLink } from '#/lib/routes/links';
import {
	convertBskyAppUrlIfNeeded,
	getChatInviteCodeFromUrl,
	isBskyChatInviteUrl,
	isBskyPostUrl,
	makeRecordUri,
	parseBskyRecordUrl,
} from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePostQuery } from '#/state/queries/post';

import { PostMeta } from '#/view/com/util/PostMeta';

import * as ChatInvite from '#/components/dms/ChatInvite';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as MediaPreview from '#/components/MediaPreview';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { RichText } from '#/components/RichText';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';
import { colors } from '#/styles/colors';

import * as css from './MessageInputEmbed.css';

function RemoveButton({ floating, onRemove }: { floating?: boolean; onRemove: () => void }) {
	return (
		<button
			aria-label={m['screens.messages.composer.embed.remove']()}
			className={clsx(css.removeButton, floating && css.removeButtonFloating)}
			onClick={onRemove}
			type="button"
		>
			<XIcon fill={colors.textContrastHigh} size="xs" />
		</button>
	);
}

/**
 * The embed staged in the message composer. A message can carry at most one embed: either a quoted post or a
 * group chat invite link.
 */
export type MessageEmbedState = { type: 'post'; uri: ResourceUri } | { type: 'invite'; code: string };

export function useMessageEmbed() {
	const [{ embed: embedFromParams }, setParams] = useParams('MessagesConversation');

	// `setEmbedState` is the raw setter; `setEmbed` below is the wrapped public callback (also a
	// prop), so the names must differ — the symmetric-pair rule can't apply here
	// eslint-disable-next-line react/hook-use-state
	const [embed, setEmbedState] = useState<MessageEmbedState | undefined>(
		embedFromParams ? { type: 'post', uri: embedFromParams } : undefined,
	);

	if (embedFromParams && embed?.type !== 'post') {
		setEmbedState({ type: 'post', uri: embedFromParams });
	}

	return {
		embed,
		setEmbed: (embedUrl: string | undefined) => {
			if (!embedUrl) {
				// Only the post embed is reflected in the route param (share-to-DM intent flow); invites are
				// local-only. clearing it replaces the entry so the shell's entry-key gate keeps the composer open.
				setParams({ embed: undefined });
				setEmbedState(undefined);
				return;
			}

			if (embedFromParams) {
				return;
			}

			if (isBskyChatInviteUrl(embedUrl)) {
				const code = getChatInviteCodeFromUrl(embedUrl);
				if (code) {
					setEmbedState({ type: 'invite', code });
				}
				return;
			}

			if (isBskyPostUrl(embedUrl)) {
				const url = convertBskyAppUrlIfNeeded(embedUrl);
				const { actor, rkey } = parseBskyRecordUrl(url);
				const uri = makeRecordUri(actor, 'app.bsky.feed.post', rkey);
				setEmbedState({ type: 'post', uri });
			}
		},
	};
}

export function MessageInputEmbed({
	embed,
	setEmbed,
}: {
	embed: MessageEmbedState | undefined;
	setEmbed: (embedUrl: string | undefined) => void;
}) {
	const onRemove = () => {
		setEmbed(undefined);
	};

	if (!embed) {
		return null;
	}

	switch (embed.type) {
		case 'post':
			return <MessageInputPostEmbed uri={embed.uri} onRemove={onRemove} />;
		case 'invite':
			return <MessageInputInviteEmbed code={embed.code} onRemove={onRemove} />;
	}
}

function MessageInputPostEmbed({ uri, onRemove }: { uri: ResourceUri; onRemove: () => void }) {
	const { data: post, status } = usePostQuery(uri);

	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts && post ? moderatePost(post, moderationOpts) : undefined;

	const { rt, record } = (() => {
		if (post) {
			const postRecord = getPostRecord(post);
			return {
				rt: { text: postRecord.text, facets: postRecord.facets ?? [] },
				record: postRecord,
			};
		}

		return { rt: undefined, record: undefined };
	})();

	switch (status) {
		case 'pending':
			return (
				<SimpleContainer onRemove={onRemove}>
					<Spinner color="default" label={m['common.status.loading']()} />
				</SimpleContainer>
			);
		case 'error':
			return (
				<SimpleContainer onRemove={onRemove}>
					<Text align="center" className={css.italic} color="textContrastMedium">
						{m['screens.messages.composer.embed.fetchError']()}
					</Text>
				</SimpleContainer>
			);
		case 'success':
			const itemUrip = parseCanonicalResourceUri(post.uri);
			const itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey);

			if (!post || !moderation || !rt || !record) {
				return null;
			}

			return (
				<div className={css.container}>
					<div className={css.metaRow}>
						<div className={css.metaColumn}>
							<PostMeta
								author={post.author}
								linkDisabled
								moderation={moderation}
								postHref={itemHref}
								showAvatar
								timestamp={post.indexedAt}
							/>
						</div>
						<RemoveButton onRemove={onRemove} />
					</div>
					<ContentHider modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}>
						<PostAlerts
							className={css.postAlerts}
							modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
							size="sm"
						/>
						{rt.text && (
							<RichText
								enableTags
								value={rt}
								color="textContrastHigh"
								size="sm"
								authorHandle={post.author.handle}
								numberOfLines={3}
							/>
						)}
						<MediaPreview.Embed className={css.embed} embed={post.embed} />
					</ContentHider>
				</div>
			);
	}
}

function MessageInputInviteEmbed({ code, onRemove }: { code: string; onRemove: () => void }) {
	const { status, preview } = ChatInvite.useChatInvite({ code });

	return (
		<div className={css.container}>
			<MessageInputInviteEmbedBody preview={preview} status={status} />
			<RemoveButton floating onRemove={onRemove} />
		</div>
	);
}

function MessageInputInviteEmbedBody({
	status,
	preview,
}: {
	status: ChatInvite.ChatInviteStatus;
	preview: ChatInvite.ChatInvitePreview | undefined;
}) {
	if (status === 'loading') {
		return <ChatInvite.Loading className={css.inviteState} />;
	}

	if (status !== 'available') {
		return <ChatInvite.Unavailable className={css.inviteState} />;
	}

	return <ChatInvite.Card preview={preview} />;
}

function SimpleContainer({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
	return (
		<div className={css.simpleContainer}>
			{children}
			{onRemove && <RemoveButton floating onRemove={onRemove} />}
		</div>
	);
}
