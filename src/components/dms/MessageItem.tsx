import { type CSSProperties, memo, type MouseEvent, useEffect, useRef } from 'react';

import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import type { Shadow } from '#/state/cache/types';
import type { ConvoItem } from '#/state/messages/convo/types';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { useSession } from '#/state/session';

import { isOnlyEmoji } from '#/alf/typography';

import * as Dialog from '#/components/Dialog';
import { ActionsWrapper } from '#/components/dms/ActionsWrapper';
import { useMessageDialogs } from '#/components/dms/MessageOverlays';
import { useMessageReplies } from '#/components/dms/MessageReplies';
import { getReplyPreviewText } from '#/components/dms/replyPreview';
import { ArrowCornerDownRight_Stroke2_Corner3_Rounded as ArrowCornerDownRightIcon } from '#/components/icons/ArrowCornerDownRight';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';
import { InlineButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

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
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const queryClient = useQueryClient();

	const { message } = item;
	const profile = useMaybeProfileShadow(relatedProfiles.get(message.sender.did));

	const { reactionsHandle } = useMessageDialogs();
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

	const pendingColor = colors.primary_300;

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
	const flashRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (highlightKey === null) {
			return;
		}
		// flash the always-mounted overlay via the Web Animations API.
		const node = flashRef.current;
		const animation = node?.animate(
			[{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }],
			{ duration: 1000, easing: 'ease' },
		);
		return () => animation?.cancel();
	}, [highlightKey]);

	const borderRadiusStyle: CSSProperties = isFromSelf
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

	const reactionPillContents = (
		<>
			{groupedReactions.slice(0, 10).map((group) => (
				<Text key={group.value} leading="none" size="lg">
					{group.value}
				</Text>
			))}
			{(groupedReactions.length !== reactions.length || groupedReactions.length > 10) &&
			reactions.length > 1 ? (
				<Text
					className={css.reactionCount}
					color={hasSelfReacted ? 'primary_900' : 'textContrastMedium'}
					leading="none"
					size="md"
					weight="semiBold"
				>
					{reactions.length}
				</Text>
			) : null}
		</>
	);

	const appliedReactions = (
		<>
			{hasReactions ? (
				<div className={css.reactionsWrap({ fromSelf: isFromSelf, groupIndent: !isFromSelf && isGroupChat })}>
					{isGroupChat ? (
						// detached Trigger: opens the reactions Dialog.Root owned by MessageOverlays, keyed to this message.
						<Dialog.Trigger
							handle={reactionsHandle}
							payload={message}
							type="button"
							aria-label={reactionsLabel}
							className={clsx(
								css.reactionPill,
								css.reactionPillButton,
								hasSelfReacted && css.reactionPillSelected,
							)}
						>
							{reactionPillContents}
						</Dialog.Trigger>
					) : (
						<div
							aria-label={reactionsLabel}
							className={clsx(css.reactionPill, hasSelfReacted && css.reactionPillSelected)}
						>
							{reactionPillContents}
						</div>
					)}
				</div>
			) : null}
		</>
	);

	const isEmojiOnly = isOnlyEmoji(message.text);
	const bubbleBackground = isFromSelf ? (isPending ? pendingColor : colors.primary_500) : colors.contrast_50;

	return (
		<>
			{hasLargeGapFromPrev && <DateDivider date={message.sentAt} />}
			<div className={css.row({ firstInCluster: isFirstInCluster, hasReactions })}>
				<div className={css.flash} ref={flashRef} />
				<div className={css.relative}>
					{showAvatar ? <div className={css.avatarSlot}>{avatar}</div> : null}
					<div className={css.col({ avatarGutter: !isFromSelf && isGroupChat })}>
						{replyTo ? (
							<ReplyCaption
								isFromSelf={isFromSelf}
								isGroupChat={isGroupChat}
								onPress={onPressReplyTo}
								relatedProfiles={relatedProfiles}
								replierDisplayName={displayName}
								replyTo={replyTo}
							/>
						) : displayName && showDisplayName ? (
							<Text className={css.displayName} color="textContrastMedium" size="xs">
								{displayName}
							</Text>
						) : null}
						{profile && isBlockedOrBlocking(profile) && isGroupChat ? (
							<BlockedPlaceholder profile={profile} radiusStyle={borderRadiusStyle} />
						) : (
							<div className={css.relative}>
								<ActionsWrapper
									isFromSelf={isFromSelf}
									message={message}
									moderationOpts={moderationOpts}
									senderProfile={profile}
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
										<div
											className={clsx(
												!isFromSelf && isGroupChat && css.bubbleIndent,
												!isEmojiOnly && css.bubbleStyled,
												!isEmojiOnly && (isFromSelf ? css.bubbleSelf : css.bubbleOther),
											)}
											style={
												isEmojiOnly
													? undefined
													: {
															marginTop: hasEmbedAndText ? CLUSTERED_MESSAGE_GAP : 0,
															backgroundColor: bubbleBackground,
															...borderRadiusStyle,
														}
											}
										>
											{replyTo && !isEmojiOnly ? (
												<ReplyQuote
													isFromSelf={isFromSelf}
													onPress={onPressReplyTo}
													relatedProfiles={relatedProfiles}
													replyTo={replyTo}
												/>
											) : null}
											<RichText
												// emoji-only content is enlarged and gets tight leading to avoid clipping the glyph;
												// non-self bubbles also pull the bottom up to bottom-align the glyph with the avatar
												className={isEmojiOnly && !isFromSelf ? css.emojiBaselineNudge : undefined}
												color={isFromSelf ? 'white' : undefined}
												emojiScale="large"
												enableTags
												leading={isEmojiOnly ? 'none' : undefined}
												linkUnderline="always"
												size="md"
												value={rt}
											/>
										</div>
									)}
								</ActionsWrapper>
								{appliedReactions}
							</div>
						)}
					</div>
				</div>
				{isLastInCluster && <MessageItemMetadata align={isFromSelf ? 'right' : 'left'} item={item} />}
			</div>
		</>
	);
};
MessageItem = memo(MessageItem);
export { MessageItem };

function MessageItemMetadata({
	item,
	align,
}: {
	item: ConvoItem & { type: 'message' | 'pending-message' };
	align: 'left' | 'right';
}): React.ReactNode {
	const handleRetry = (e: MouseEvent) => {
		if (item.type === 'pending-message' && item.retry) {
			e.preventDefault();
			item.retry();
		}
	};

	switch (item.type) {
		case 'pending-message':
			return item.failed ? (
				<Text align={align} className={css.meta} color="negative_400" size="xs">
					<Text color="negative_400" size="xs">
						{m['components.dms.message.error.sendFailed']()}
					</Text>
					{item.retry && (
						<>
							{' '}
							<InlineButton
								color="negative_400"
								label={m['components.dms.message.action.retry']()}
								onClick={handleRetry}
								size="xs"
							>
								{m['components.dms.message.a11y.retry']()}
							</InlineButton>
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
	radiusStyle,
}: {
	profile: Shadow<ChatBskyActorDefs.ProfileViewBasic>;
	radiusStyle?: CSSProperties;
}) {
	const control = Prompt.usePromptHandle();
	const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile);

	const label = profile.viewer?.blocking
		? m['components.dms.block.messageHiddenYouBlocking']()
		: m['components.dms.block.messageHiddenBlockingYou']();

	return (
		<>
			<button
				aria-label={label}
				className={css.blockedButton}
				onClick={() => control.open(null)}
				type="button"
			>
				<div className={css.blockedBubble} style={radiusStyle}>
					<Text className={css.italic} color="textContrastMedium" size="sm">
						{label}
					</Text>
				</div>
			</button>
			<Prompt.Outer handle={control}>
				<Prompt.Content>
					<Prompt.TitleText>
						{profile.viewer?.blocking
							? m['components.dms.block.youAreBlocking']({ handle: `@${profile.handle}` })
							: m['components.dms.block.isBlockingYou']({ handle: `@${profile.handle}` })}
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
 * caption rendered above a reply message indicating who replied to whom.
 *
 * aligns with the sender's display name for others (left), or with the message bubble for self (right).
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

	const captionAlign = isFromSelf ? 'self' : isGroupChat ? 'otherGroup' : 'otherPlain';

	return (
		<button
			aria-label={
				onPress ? m['components.dms.reply.a11y.scrollTo']() : m['components.dms.reply.a11y.beforeJoined']()
			}
			className={css.replyCaption({ align: captionAlign })}
			disabled={!onPress}
			onClick={onPress}
			type="button"
		>
			<ArrowCornerDownRightIcon fill={colors.textContrastMedium} size="xs" />
			<Text className={css.replyCaptionText} color="textContrastMedium" numberOfLines={1} size="xs">
				{caption}
			</Text>
		</button>
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

	const tintColor = isFromSelf ? 'white' : 'text';
	const subtleColor = isFromSelf ? 'white' : 'textContrastHigh';
	const borderColor = isFromSelf ? 'rgba(255, 255, 255, 0.5)' : colors.borderContrastHigh;

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
		<button
			aria-label={
				!onPress
					? m['components.dms.reply.a11y.repliedToBeforeJoined']()
					: senderName
						? m['components.dms.reply.a11y.repliedToFrom']({ name: senderName })
						: m['components.dms.reply.a11y.repliedTo']()
			}
			className={css.replyQuote}
			disabled={!onPress}
			onClick={onPress}
			style={{ borderColor }}
			type="button"
		>
			{senderName ? (
				<Text color={subtleColor} numberOfLines={1} size="xs">
					{senderName}
				</Text>
			) : null}
			<Text
				className={clsx(subtle && css.italic)}
				color={subtle ? subtleColor : tintColor}
				numberOfLines={2}
				size="sm"
			>
				{text}
			</Text>
		</button>
	);
}
