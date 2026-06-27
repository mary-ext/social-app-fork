import { useState } from 'react';
import { LayoutAnimation, View } from 'react-native';
import type { AppBskyFeedPost } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans, useLingui } from '@lingui/react/macro';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { HITSLOP_20 } from '#/lib/constants';
import { makeProfileLink } from '#/lib/routes/links';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';
import {
	convertBskyAppUrlIfNeeded,
	getChatInviteCodeFromUrl,
	isBskyChatInviteUrl,
	isBskyPostUrl,
	makeRecordUri,
} from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePostQuery } from '#/state/queries/post';

import { PostMeta } from '#/view/com/util/PostMeta';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import * as ChatInvite from '#/components/dms/ChatInvite';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import * as MediaPreview from '#/components/MediaPreview';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';

import * as css from './MessageInputEmbed.css';

/**
 * The embed staged in the message composer. A message can carry at most one embed: either a quoted post or a
 * group chat invite link.
 */
export type MessageEmbedState = { type: 'post'; uri: string } | { type: 'invite'; code: string };

export function useMessageEmbed() {
	const route = useRoute<RouteProp<CommonNavigatorParams, 'MessagesConversation'>>();
	const navigation = useNavigation<NavigationProp>();
	const embedFromParams = route.params.embed;

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
				// Only the post embed is reflected in the route param (used by the share-to-DM intent flow);
				// invites are local-only.
				navigation.setParams({ embed: '' });
				setEmbedState(undefined);
				return;
			}

			if (embedFromParams) return;

			if (isBskyChatInviteUrl(embedUrl)) {
				const code = getChatInviteCodeFromUrl(embedUrl);
				if (code) {
					setEmbedState({ type: 'invite', code });
				}
				return;
			}

			if (isBskyPostUrl(embedUrl)) {
				const url = convertBskyAppUrlIfNeeded(embedUrl);
				const [_0, user, _1, rkey] = url.split('/').filter(Boolean) as [string, string, string, string];
				const uri = makeRecordUri(user, 'app.bsky.feed.post', rkey);
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
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

function MessageInputPostEmbed({ uri, onRemove }: { uri: string; onRemove: () => void }) {
	const t = useTheme();
	const { t: l } = useLingui();

	const { data: post, status } = usePostQuery(uri);

	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts && post ? moderatePost(post, moderationOpts) : undefined;

	const { rt, record } = (() => {
		if (post) {
			const postRecord = post.record as AppBskyFeedPost.Main;
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
					<Loader />
				</SimpleContainer>
			);
		case 'error':
			return (
				<SimpleContainer onRemove={onRemove}>
					<Text style={[a.text_center, t.atoms.text_contrast_medium, a.italic]}>
						<Trans>Could not fetch post</Trans>
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
				<View
					style={[a.flex_1, t.atoms.border_contrast_high, a.rounded_md, a.border, a.p_sm, a.mt_sm, a.mx_sm]}
				>
					<View style={[a.flex_1, a.flex_row, a.gap_sm]}>
						<View style={[a.flex_1, a.pb_xs]}>
							<PostMeta
								showAvatar
								author={post.author}
								moderation={moderation}
								timestamp={post.indexedAt}
								postHref={itemHref}
								linkDisabled
							/>
						</View>
						<Button
							label={l`Remove embed`}
							onPress={onRemove}
							style={[a.px_2xs, { transform: [{ translateY: -2 }] }]}
							hitSlop={HITSLOP_20}
						>
							<XIcon size="xs" style={t.atoms.text_contrast_high} />
						</Button>
					</View>
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
						<MediaPreview.Embed embed={post.embed} style={a.mt_sm} />
					</ContentHider>
				</View>
			);
	}
}

function MessageInputInviteEmbed({ code, onRemove }: { code: string; onRemove: () => void }) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { status, preview } = ChatInvite.useChatInvite({ code });

	return (
		<View style={[a.flex_1, t.atoms.border_contrast_high, a.rounded_md, a.border, a.p_sm, a.mt_sm, a.mx_sm]}>
			<MessageInputInviteEmbedBody status={status} preview={preview} />
			<Button
				label={l`Remove embed`}
				onPress={onRemove}
				style={[a.absolute, { top: 10, right: 8 }, a.px_2xs, { transform: [{ translateY: -2 }] }]}
				hitSlop={HITSLOP_20}
			>
				<XIcon size="xs" style={t.atoms.text_contrast_high} />
			</Button>
		</View>
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
	const t = useTheme();
	const { t: l } = useLingui();
	return (
		<View
			style={[
				a.flex_1,
				{ minHeight: 80 },
				a.justify_center,
				a.align_center,
				t.atoms.border_contrast_high,
				a.rounded_md,
				a.border,
				a.mt_sm,
				a.mx_sm,
			]}
		>
			{children}
			{onRemove && (
				<Button
					label={l`Remove embed`}
					onPress={onRemove}
					style={[a.absolute, { top: 10, right: 8 }, a.px_2xs, { transform: [{ translateY: -2 }] }]}
					hitSlop={HITSLOP_20}
				>
					<XIcon size="xs" style={t.atoms.text_contrast_high} />
				</Button>
			)}
		</View>
	);
}
