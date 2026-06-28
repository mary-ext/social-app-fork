import { useCallback, useState } from 'react';
import { View } from 'react-native';
import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { clsx } from 'clsx';

import { EMOJI_REACTION_LIMIT } from '#/lib/constants';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useConvoActive } from '#/state/messages/convo';
import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import { MessageContextMenu } from '#/components/dms/MessageContextMenu';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon } from '#/components/icons/DotGrid';
import { EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { EmojiReactionPicker } from './EmojiReactionPicker';
import * as reactionStyles from './EmojiReactionPicker.css';
import { canReact, hasReachedReactionLimit } from './util';

export function ActionsWrapper({
	message,
	isFromSelf,
	senderProfile,
	moderationOpts,
	children,
}: {
	message: ChatBskyConvoDefs.MessageView;
	isFromSelf: boolean;
	senderProfile?: AnyProfileView;
	moderationOpts: ModerationOptions | undefined;
	children: React.ReactNode;
}) {
	const t = useTheme();
	const convo = useConvoActive();
	const { currentAccount } = useSession();
	const primaryMember = useMaybeProfileShadow(convo.convo.primaryMember);
	const reactionsAvailable = canReact({
		convoState: convo,
		primaryMember,
		moderationOpts,
	});

	const [showActions, setShowActions] = useState(false);

	const onMouseEnter = useCallback(() => {
		setShowActions(true);
	}, []);

	const onMouseLeave = useCallback(() => {
		setShowActions(false);
	}, []);

	// We need to handle the `onFocus` separately because we want to know if there is a related target (the element
	// that is losing focus). If there isn't that means the focus is coming from a dropdown that is now closed.
	const onFocus = useCallback<React.FocusEventHandler>((e) => {
		if (e.nativeEvent.relatedTarget == null) return;
		setShowActions(true);
	}, []);

	const onEmojiSelect = useCallback(
		(emoji: string) => {
			if (
				message.reactions?.find(
					(reaction) => reaction.value === emoji && reaction.sender.did === currentAccount?.did,
				)
			) {
				convo
					.removeReaction(message.id, emoji)
					.catch(() => Toast.show(m['components.dms.reaction.error.remove']()));
			} else {
				if (hasReachedReactionLimit(message, currentAccount?.did)) {
					Toast.show(m['components.dms.reaction.error.limit']({ limit: EMOJI_REACTION_LIMIT }), {
						type: 'info',
					});
					return;
				}
				convo.addReaction(message.id, emoji).catch(() =>
					Toast.show(m['components.dms.reaction.error.add'](), {
						type: 'error',
					}),
				);
			}
		},
		[convo, message, currentAccount?.did],
	);

	return (
		<View
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			// @ts-expect-error web only
			onFocus={onFocus}
			onBlur={onMouseLeave}
			style={[a.flex_1, isFromSelf ? a.flex_row : a.flex_row_reverse]}
		>
			<View
				style={[
					a.justify_center,
					a.flex_row,
					a.align_center,
					isFromSelf
						? [a.mr_xs, { marginLeft: 'auto' }, a.flex_row_reverse]
						: [a.ml_xs, { marginRight: 'auto' }],
				]}
			>
				{reactionsAvailable && (
					<EmojiReactionPicker
						message={message}
						onEmojiSelect={onEmojiSelect}
						render={(props, state) => (
							<button
								{...props}
								type="button"
								aria-label={m['components.dms.reaction.action.add']()}
								className={clsx(props.className, reactionStyles.trigger)}
								style={{ ...props.style, opacity: showActions || state.open ? 1 : 0 }}
							>
								<EmojiSmileIcon size="md" style={t.atoms.text_contrast_medium} />
							</button>
						)}
					/>
				)}
				<MessageContextMenu
					message={message}
					senderProfile={senderProfile}
					moderationOpts={moderationOpts}
					render={(props, state) => (
						<button
							{...props}
							type="button"
							aria-label={m['components.dms.message.a11y.options']()}
							className={clsx(props.className, reactionStyles.trigger)}
							style={{ ...props.style, opacity: showActions || state.open ? 1 : 0 }}
						>
							<DotsHorizontalIcon size="md" style={t.atoms.text_contrast_medium} />
						</button>
					)}
				/>
			</View>
			<View style={[{ maxWidth: '80%' }, isFromSelf ? a.align_end : a.align_start]}>{children}</View>
		</View>
	);
}
