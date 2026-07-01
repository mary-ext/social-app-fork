import { memo, useEffect, useRef } from 'react';
import {
	type GestureResponderEvent,
	Pressable,
	type StyleProp,
	type TextStyle,
	View,
	type ViewStyle,
} from 'react-native';
import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';
import { useQueryClient } from '@tanstack/react-query';

import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import type { Shadow } from '#/state/cache/types';
import type { ConvoItem } from '#/state/messages/convo/types';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { useSession } from '#/state/session';

import { atoms as a, useTheme, utils } from '#/alf';
import { isOnlyEmoji } from '#/alf/typography';

import { Button } from '#/components/Button';
import { ActionsWrapper } from '#/components/dms/ActionsWrapper';
import { useMessageDialogs } from '#/components/dms/MessageOverlays';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import { getReplyPreviewText } from '#/components/dms/replyPreview';
import { ArrowCornerDownRight_Stroke2_Corner3_Rounded as ArrowCornerDownRightIcon } from '#/components/icons/ArrowCornerDownRight';
import { InlineLinkText } from '#/components/Link';
import * as ProfileCard from '#/components/ProfileCard';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

import { DateDivider } from './DateDivider';
import * as css from './MessageItem.css';
import { MessageItemEmbed } from './MessageItemEmbed';
import { MessageItemInviteEmbed } from './MessageItemInviteEmbed';
import { groupReactions } from './ReactionsDialog';
import { CLUSTERED_MESSAGE_THRESHOLD_MS, filterBlockedReactions, MESSAGE_GAP_THRESHOLD_MS } from './util';

const AVATAR_SIZE = 28;
const CLUSTERED_MESSAGE_GAP = 2;
const BORDER_RADIUS = 20;
const SQUARED_BORDER_RADIUS = 4;
const DISPLAY_NAME_INSET = 22;

export type MessageItemNeighbor = ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView | null;

function messageIsReply(message: MessageItemNeighbor): boolean {
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
	adjacentMessage: MessageItemNeighbor;
	isFromSameSender: boolean;
	direction: 'prev' | 'next';
}): boolean {
	// A reply always starts its own cluster, breaking grouping with the message
	// above it. Looking back, that's a boundary if this message is a reply;
	// looking forward, it's a boundary if the next message is a reply.
	if (messageIsReply(direction === 'prev' ? message : adjacentMessage)) {
		return true;
	}
	if (!isFromSameSender) return true;
	if (adjacentMessage?.$type === 'chat.bsky.convo.defs#messageView') {
		const currentSentAt = message.sentAt;
		const thisDate = new Date(currentSentAt);
		const adjDate = new Date(adjacentMessage.sentAt);
		const diff =
			direction === 'next' ? adjDate.getTime() - thisDate.getTime() : thisDate.getTime() - adjDate.getTime();
		const isOutsideThreshold = diff > CLUSTERED_MESSAGE_THRESHOLD_MS;
		if (isPending) return isOutsideThreshold;
		return isOutsideThreshold;
	}
	return true;
}

let MessageItem = ({
	item,
	isGroupChat = false,
	prevMessage,
	nextMessage,
	relatedProfiles,
}: {
	item: ConvoItem & { type: 'message' | 'pending-message' };
	isGroupChat?: boolean;
	prevMessage: MessageItemNeighbor;
	nextMessage: MessageItemNeighbor;
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>;
}): React.ReactNode => {
	const t = useTheme();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const queryClient = useQueryClient();

	const { message } = item;
	const profile = useMaybeProfileShadow(relatedProfiles.get(message.sender.did));

	const { openReactions } = useMessageDialogs();
	const { scrollToMessage, highlightedMessage } = useMessageReplies();

	// `replyTo` comes back hydrated as the referenced message, a deleted-message
	// tombstone, or a before-joined placeholder. Narrow away the open-union
	// fallback so we only render shapes we understand.
	const replyTo =
		message.replyTo?.$type === 'chat.bsky.convo.defs#messageView' ||
		message.replyTo?.$type === 'chat.bsky.convo.defs#deletedMessageView' ||
		message.replyTo?.$type === 'chat.bsky.convo.defs#messageBeforeUserJoinedGroupView'
			? message.replyTo
			: undefined;
	// A before-joined placeholder carries no id, so there's nothing to scroll to;
	// leaving `onPress` undefined disables the reply affordance for that case.
	const replyToMessageId =
		replyTo && replyTo.$type !== 'chat.bsky.convo.defs#messageBeforeUserJoinedGroupView'
			? replyTo.id
			: undefined;
	const onPressReplyTo = replyToMessageId ? () => scrollToMessage(replyToMessageId) : undefined;

	const isPending = item.type === 'pending-message';

	const displayName = profile ? createSanitizedDisplayName(profile) : null;

	const isFromSelf = message.sender?.did != null && message.sender.did === currentAccount?.did;

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

	const hasLargeGapFromPrev =
		prevMessage?.$type !== 'chat.bsky.convo.defs#messageView' ||
		new Date(message.sentAt).getTime() - new Date(prevMessage.sentAt).getTime() > MESSAGE_GAP_THRESHOLD_MS;

	const isInCluster = !(isFirstInCluster && isLastInCluster);
	const isInMiddleOfCluster = isInCluster && !isFirstInCluster && !isLastInCluster;

	const visibleReactions = filterBlockedReactions(message.reactions, relatedProfiles);

	const hasReactions = visibleReactions.length > 0;
	const prevHasReactions =
		prevIsMessage && filterBlockedReactions(prevMessage.reactions, relatedProfiles).length > 0;
	const isNextEmojiOnly = nextIsMessage && isOnlyEmoji(nextMessage.text);
	const isPrevEmojiOnly = prevIsMessage && isOnlyEmoji(prevMessage.text);
	const squaredBottomCorner =
		!hasReactions && !isNextEmojiOnly && isInCluster && (isInMiddleOfCluster || isFirstInCluster);
	const squaredTopCorner =
		!prevHasReactions && !isPrevEmojiOnly && isInCluster && (isInMiddleOfCluster || isLastInCluster);

	const pendingColor = t.palette.primary_300;

	const rt = { text: message.text, facets: message.facets ?? [] };

	const hasEmbed =
		message.embed?.$type === 'app.bsky.embed.record#view' ||
		message.embed?.$type === 'chat.bsky.embed.joinLink#view';
	const hasEmbedAndText = hasEmbed && rt.text.length > 0;

	const targetBottomRadius = squaredBottomCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS;
	const targetTopRadius = squaredTopCorner || hasEmbedAndText ? SQUARED_BORDER_RADIUS : BORDER_RADIUS;

	const showDisplayName = isGroupChat && !isFromSelf && isFirstInCluster && !isOnlyEmoji(message.text);
	const showAvatar = isGroupChat && !isFromSelf && isLastInCluster;

	// Flash the message background when it's been scrolled to (e.g. by tapping a
	// reply that quotes it), so it's easy to spot. Keyed on the highlight `key`
	// so re-tapping the same message re-triggers the flash.
	const isHighlighted = highlightedMessage?.id === message.id;
	const highlightKey = isHighlighted ? highlightedMessage.key : null;
	const flashRef = useRef<View | null>(null);
	useEffect(() => {
		if (highlightKey === null) return;
		// The fork's reanimated shim can't drive imperative shared-value animations,
		// so flash the always-mounted overlay via the Web Animations API instead.
		const node = flashRef.current as unknown as HTMLElement | null;
		const animation = node?.animate(
			[{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }],
			{ duration: 1000, easing: 'ease' },
		);
		return () => animation?.cancel();
	}, [highlightKey]);

	const borderRadiusStyle = isFromSelf
		? {
				borderBottomRightRadius: targetBottomRadius,
				borderTopRightRadius: targetTopRadius,
			}
		: {
				borderBottomLeftRadius: targetBottomRadius,
				borderTopLeftRadius: targetTopRadius,
			};

	const avatar =
		profile && moderationOpts ? (
			<ProfileCard.Avatar
				profile={profile}
				size={AVATAR_SIZE}
				moderationOpts={moderationOpts}
				onPress={() => unstableCacheProfileView(queryClient, profile)}
			/>
		) : (
			<ProfileCard.AvatarPlaceholder size={AVATAR_SIZE} />
		);

	const groupedReactions = groupReactions(visibleReactions);

	const reactions = visibleReactions;

	const hasSelfReacted = reactions.some((r) => r.sender.did === currentAccount?.did);

	let reactionsLabel = '';
	if (reactions.length === 1) {
		const reaction = reactions[0]!;
		const sender = reaction.sender;
		if (sender.did === currentAccount?.did) {
			reactionsLabel = m['components.dms.update.youReacted']({ value: reaction.value });
		} else {
			const senderDid = reaction.sender.did;
			const memberSender = relatedProfiles.get(senderDid);
			if (memberSender) {
				reactionsLabel = m['components.dms.reaction.reactedBy']({
					name: createSanitizedDisplayName(memberSender),
					reaction: reaction.value,
				});
			} else {
				reactionsLabel = m['components.dms.update.someoneReacted']({ value: reaction.value });
			}
		}
	} else if (reactions.length > 1) {
		reactionsLabel = m['components.dms.reaction.summary']({
			count: reactions.length,
			values: groupedReactions.map((g) => g.value).join(' '),
		});
	}

	const appliedReactions = (
		<>
			{hasReactions ? (
				<View
					style={[
						a.absolute,
						{ top: '100%' },
						isFromSelf ? [a.right_0] : [a.left_0, isGroupChat && a.ml_sm],
						a.px_sm,
						a.z_10,
					]}
				>
					<Pressable
						accessible={true}
						accessibilityLabel={reactionsLabel}
						accessibilityHint={isGroupChat ? m['components.dms.reaction.a11y.view']() : undefined}
						style={[
							a.flex_row,
							a.gap_2xs,
							isFromSelf ? a.justify_end : a.justify_start,
							a.rounded_lg,
							a.border,
							t.atoms.border_contrast_low,
							t.atoms.shadow_xs,
							a.px_sm,
							hasSelfReacted ? { backgroundColor: t.palette.primary_100 } : t.atoms.bg_contrast_25,
							{
								paddingTop: 3,
								paddingBottom: 3,
								transform: [{ translateY: -6 }],
							},
						]}
						onPress={isGroupChat ? () => openReactions(message) : undefined}
					>
						{groupedReactions.slice(0, 10).map((group) => (
							<View key={group.value} style={[a.py_2xs]}>
								<Text emoji style={[a.text_md, { textAlignVertical: 'center', includeFontPadding: false }]}>
									{group.value}
								</Text>
							</View>
						))}
						{(groupedReactions.length !== reactions.length || groupedReactions.length > 10) &&
						reactions.length > 1 ? (
							<View style={[a.p_2xs, a.pl_0, a.justify_center]}>
								<Text
									style={[
										a.text_sm,
										a.font_medium,
										hasSelfReacted ? { color: t.palette.primary_900 } : t.atoms.text_contrast_high,
										{ textAlignVertical: 'center', includeFontPadding: false },
									]}
								>
									{reactions.length}
								</Text>
							</View>
						) : null}
					</Pressable>
				</View>
			) : null}
		</>
	);

	const messageInset = a.mx_lg;
	// Negative of `messageInset` so the flash bleeds past the row's horizontal
	// margin to the screen edges.
	const flashBleed = -a.mx_lg.marginLeft;

	return (
		<>
			{hasLargeGapFromPrev && <DateDivider date={message.sentAt} />}
			<View
				style={[
					messageInset,
					isFirstInCluster ? a.mt_md : { marginTop: CLUSTERED_MESSAGE_GAP },
					hasReactions && { paddingBottom: 26 },
				]}
			>
				<View
					ref={flashRef}
					pointerEvents="none"
					style={[
						a.absolute,
						{
							top: -CLUSTERED_MESSAGE_GAP,
							bottom: -CLUSTERED_MESSAGE_GAP,
							left: flashBleed,
							right: flashBleed,
							backgroundColor: t.palette.primary_100,
							opacity: 0,
						},
					]}
				/>
				<View style={[a.relative]}>
					{showAvatar ? <View style={[a.absolute, a.bottom_0, a.z_50]}>{avatar}</View> : null}
					<View style={[a.relative, a.flex_grow, !isFromSelf && isGroupChat && { paddingLeft: AVATAR_SIZE }]}>
						{replyTo ? (
							<ReplyCaption
								replyTo={replyTo}
								isFromSelf={isFromSelf}
								isGroupChat={isGroupChat}
								replierDisplayName={displayName}
								relatedProfiles={relatedProfiles}
								onPress={onPressReplyTo}
							/>
						) : displayName && showDisplayName ? (
							<Text
								style={[
									a.text_xs,
									t.atoms.text_contrast_medium,
									a.pt_xs,
									a.pb_2xs,
									{ paddingLeft: DISPLAY_NAME_INSET },
								]}
								emoji
							>
								{displayName}
							</Text>
						) : null}
						{profile && isBlockedOrBlocking(profile) && isGroupChat ? (
							<BlockedPlaceholder profile={profile} style={borderRadiusStyle} />
						) : (
							<View style={[a.relative]}>
								<ActionsWrapper
									isFromSelf={isFromSelf}
									message={message}
									senderProfile={profile}
									moderationOpts={moderationOpts}
								>
									{message.embed?.$type === 'app.bsky.embed.record#view' && (
										<MessageItemEmbed
											embed={message.embed}
											isFromSelf={isFromSelf}
											isGroupChat={isGroupChat}
											squaredBottomCorner={squaredBottomCorner || hasEmbedAndText}
											squaredTopCorner={squaredTopCorner}
										/>
									)}
									{message.embed?.$type === 'chat.bsky.embed.joinLink#view' && (
										<MessageItemInviteEmbed
											embed={message.embed}
											isFromSelf={isFromSelf}
											isGroupChat={isGroupChat}
											squaredBottomCorner={squaredBottomCorner || hasEmbedAndText}
											squaredTopCorner={squaredTopCorner}
										/>
									)}
									{rt.text.length > 0 && (
										<View
											accessibilityHint={m['components.dms.reaction.hint']()}
											style={[
												!isFromSelf && isGroupChat && a.ml_sm,
												!isOnlyEmoji(message.text) && [
													a.rounded_xl,
													a.py_sm,
													a.px_md,
													a.max_w_full,
													{
														marginTop: hasEmbedAndText ? CLUSTERED_MESSAGE_GAP : 0,
														backgroundColor: isFromSelf
															? isPending
																? pendingColor
																: t.palette.primary_500
															: t.palette.contrast_50,
													},
													isFromSelf ? a.self_end : a.self_start,
													borderRadiusStyle,
												],
											]}
										>
											{replyTo && !isOnlyEmoji(message.text) ? (
												<ReplyQuote
													replyTo={replyTo}
													isFromSelf={isFromSelf}
													relatedProfiles={relatedProfiles}
													onPress={onPressReplyTo}
												/>
											) : null}
											<RichText
												// emoji-only content is enlarged and gets tight leading to avoid clipping the glyph;
												// non-self bubbles also pull the bottom up to bottom-align the glyph with the avatar
												className={
													isOnlyEmoji(message.text) && !isFromSelf ? css.emojiBaselineNudge : undefined
												}
												color={isFromSelf ? 'white' : undefined}
												emojiScale="large"
												enableTags
												leading={isOnlyEmoji(message.text) ? 'none' : undefined}
												linkUnderline="always"
												size="md"
												value={rt}
											/>
										</View>
									)}
								</ActionsWrapper>
								{appliedReactions}
							</View>
						)}
					</View>
				</View>
				{isLastInCluster && (
					<MessageItemMetadata item={item} style={[isFromSelf ? a.text_right : a.text_left]} />
				)}
			</View>
		</>
	);
};
MessageItem = memo(MessageItem);
export { MessageItem };

function MessageItemMetadata({
	item,
	style,
}: {
	item: ConvoItem & { type: 'message' | 'pending-message' };
	style: StyleProp<TextStyle>;
}): React.ReactNode {
	const t = useTheme();
	const handleRetry = (e: GestureResponderEvent) => {
		if (item.type === 'pending-message' && item.retry) {
			e.preventDefault();
			item.retry();
			return false;
		}
	};

	const errorColor = t.palette.negative_400;

	switch (item.type) {
		case 'pending-message':
			return item.failed ? (
				<Text style={[a.text_xs, a.my_2xs, { color: errorColor }, style]}>
					<Text style={[a.text_xs, { color: errorColor }]}>
						{m['components.dms.message.error.sendFailed']()}
					</Text>
					{item.retry && (
						<>
							{' '}
							<InlineLinkText
								label={m['components.dms.message.action.retry']()}
								to="#"
								onPress={handleRetry}
								style={[a.text_xs, { color: errorColor }]}
							>
								{m['components.dms.message.a11y.retry']()}
							</InlineLinkText>
							.
						</>
					)}
				</Text>
			) : null;
		default:
			return null;
	}
}
export { MessageItemMetadata };

function BlockedPlaceholder({
	profile,
	style,
}: {
	profile: Shadow<ChatBskyActorDefs.ProfileViewBasic>;
	style?: StyleProp<ViewStyle>;
}) {
	const t = useTheme();
	const control = Prompt.usePromptControl();
	const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile);

	return (
		<>
			<Button
				style={[{ maxWidth: '80%' }, a.self_start]}
				label={
					profile.viewer?.blocking
						? m['components.dms.block.messageHiddenYouBlocking']()
						: m['components.dms.block.messageHiddenBlockingYou']()
				}
				accessibilityHint={m['components.dms.message.a11y.tapForDetails']()}
				onPress={() => control.open()}
			>
				<View
					style={[
						a.ml_sm,
						a.rounded_xl,
						a.py_sm,
						a.px_md,
						t.atoms.bg,
						a.self_start,
						a.border,
						t.atoms.border_contrast_high,
						a.flex_shrink,
						style,
					]}
				>
					<Text style={[a.text_sm, a.leading_snug, a.italic, t.atoms.text_contrast_medium]}>
						{profile.viewer?.blocking
							? m['components.dms.block.messageHiddenYouBlocking']()
							: m['components.dms.block.messageHiddenBlockingYou']()}
					</Text>
				</View>
			</Button>
			<Prompt.Outer control={control}>
				<Prompt.Content>
					<Prompt.TitleText>
						{profile.viewer?.blocking
							? m['components.dms.block.youAreBlocking']({ handle: sanitizeHandle(profile.handle, '@') })
							: m['components.dms.block.isBlockingYou']({ handle: sanitizeHandle(profile.handle, '@') })}
					</Prompt.TitleText>
					<Prompt.DescriptionText>
						{profile.viewer?.blocking
							? m['components.dms.block.hiddenYouBlocking']()
							: m['components.dms.block.hiddenBlockingYou']()}
					</Prompt.DescriptionText>
					<Prompt.Actions>
						<Prompt.Action onPress={() => {}} cta={m['common.action.okay']()} color="primary" />
						{profile.viewer?.blocking && !profile.viewer.blockingByList && (
							<Prompt.Action
								onPress={() => void queueUnblock()}
								cta={m['common.block.action.unblock']()}
								color="secondary"
							/>
						)}
					</Prompt.Actions>
				</Prompt.Content>
			</Prompt.Outer>
		</>
	);
}

/**
 * The "↪ X replied to Y" caption rendered above a reply message, in place of the display name. `X` is the
 * person sending the reply (self -> "you"), `Y` is the original sender. Tapping it scrolls to the original
 * (if loaded).
 *
 * Aligns with the sender's display name for others (left), or with the message bubble for self (right).
 */
function ReplyCaption({
	replyTo,
	isFromSelf,
	isGroupChat,
	replierDisplayName,
	relatedProfiles,
	onPress,
}: {
	replyTo:
		| ChatBskyConvoDefs.MessageView
		| ChatBskyConvoDefs.DeletedMessageView
		| ChatBskyConvoDefs.MessageBeforeUserJoinedGroupView;
	isFromSelf: boolean;
	isGroupChat: boolean;
	replierDisplayName: string | null;
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>;
	onPress?: () => void;
}) {
	const t = useTheme();
	const { currentAccount } = useSession();

	// The before-joined placeholder carries no sender, so fall back to a generic caption.
	let caption = m['components.dms.reply.someoneReplied']();
	if (
		replyTo.$type === 'chat.bsky.convo.defs#messageView' ||
		replyTo.$type === 'chat.bsky.convo.defs#deletedMessageView'
	) {
		const originalSenderIsSelf = replyTo.sender.did === currentAccount?.did;
		const originalProfile = relatedProfiles.get(replyTo.sender.did);
		const originalName = originalSenderIsSelf
			? null
			: originalProfile
				? createSanitizedDisplayName(originalProfile)
				: null;
		caption = isFromSelf
			? originalSenderIsSelf
				? m['components.dms.update.youRepliedToYourself']()
				: originalName
					? m['components.dms.update.youRepliedTo']({ originalName })
					: m['components.dms.update.youReplied']()
			: originalSenderIsSelf
				? m['components.dms.reply.repliedToYou']({ replier: replierDisplayName ?? '' })
				: originalName
					? m['components.dms.reply.repliedTo']({ original: originalName, replier: replierDisplayName ?? '' })
					: m['components.dms.reply.replied']({ replier: replierDisplayName ?? '' });
	}

	return (
		<Button
			label={
				onPress ? m['components.dms.reply.a11y.scrollTo']() : m['components.dms.reply.a11y.beforeJoined']()
			}
			disabled={!onPress}
			onPress={onPress}
			style={[
				a.w_full,
				a.flex_row,
				a.align_center,
				a.gap_2xs,
				a.pb_2xs,
				a.pt_xs,
				isFromSelf
					? [a.justify_end, a.pr_md]
					: [a.justify_start, isGroupChat ? { paddingLeft: DISPLAY_NAME_INSET } : a.pl_md],
			]}
		>
			<ArrowCornerDownRightIcon size="xs" style={t.atoms.text_contrast_medium} />
			<Text style={[a.text_xs, a.flex_shrink, t.atoms.text_contrast_medium]} numberOfLines={1} emoji>
				{caption}
			</Text>
		</Button>
	);
}

/**
 * The nested quote of the original message, rendered at the top of a reply bubble. Tapping it scrolls to the
 * original (if loaded).
 */
function ReplyQuote({
	replyTo,
	isFromSelf,
	relatedProfiles,
	onPress,
}: {
	replyTo:
		| ChatBskyConvoDefs.MessageView
		| ChatBskyConvoDefs.DeletedMessageView
		| ChatBskyConvoDefs.MessageBeforeUserJoinedGroupView;
	isFromSelf: boolean;
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>;
	onPress?: () => void;
}) {
	const t = useTheme();
	const senderDid =
		replyTo.$type === 'chat.bsky.convo.defs#messageView' ||
		replyTo.$type === 'chat.bsky.convo.defs#deletedMessageView'
			? replyTo.sender.did
			: undefined;
	const senderProfile = useMaybeProfileShadow(senderDid ? relatedProfiles.get(senderDid) : undefined);
	// Hide the quoted content if we block, or are blocked by, the original
	// sender - mirroring how the message bubble itself is hidden.
	const isBlocked = senderProfile ? isBlockedOrBlocking(senderProfile) : false;
	const senderName = senderProfile && !isBlocked ? createSanitizedDisplayName(senderProfile) : null;

	const tintColor = isFromSelf ? t.palette.white : t.atoms.text.color;
	const subtleColor = isFromSelf ? t.palette.white : t.atoms.text_contrast_high.color;
	const borderColor = isFromSelf
		? utils.alpha(t.palette.white, 0.5)
		: t.atoms.border_contrast_high.borderColor;

	let text: string;
	let subtle = false;
	if (isBlocked) {
		text = m['components.dms.block.messageHidden']();
		subtle = true;
	} else if (replyTo.$type === 'chat.bsky.convo.defs#messageView') {
		({ subtle, text } = getReplyPreviewText(replyTo));
	} else if (replyTo.$type === 'chat.bsky.convo.defs#messageBeforeUserJoinedGroupView') {
		text = m['components.dms.reply.beforeJoined']();
		subtle = true;
	} else {
		text = m['components.dms.message.deleted']();
		subtle = true;
	}

	return (
		<Button
			label={
				!onPress
					? m['components.dms.reply.a11y.repliedToBeforeJoined']()
					: senderName
						? m['components.dms.reply.a11y.repliedToFrom']({ name: senderName })
						: m['components.dms.reply.a11y.repliedTo']()
			}
			disabled={!onPress}
			onPress={onPress}
			style={[
				a.mb_xs,
				a.rounded_md,
				a.p_sm,
				a.flex_col,
				a.align_start,
				a.border,
				{ borderColor, marginHorizontal: -4 },
			]}
		>
			{senderName ? (
				<Text style={[a.text_xs, { color: subtleColor }]} emoji numberOfLines={1}>
					{senderName}
				</Text>
			) : null}
			<Text
				style={[a.text_sm, { color: subtle ? subtleColor : tintColor }, subtle && a.italic]}
				emoji
				numberOfLines={2}
			>
				{text}
			</Text>
		</Button>
	);
}
