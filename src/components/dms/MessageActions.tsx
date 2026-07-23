import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { EMOJI_REACTION_LIMIT } from '#/lib/constants';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useConvoActive } from '#/state/messages/convo';
import { useSession } from '#/state/session';

import { MessageContextMenu } from '#/components/dms/MessageContextMenu';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon } from '#/components/icons/DotGrid';
import { EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon } from '#/components/icons/Emoji';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { EmojiReactionPicker } from './EmojiReactionPicker';
import * as reactionStyles from './EmojiReactionPicker.css';
import { canReact, hasReachedReactionLimit } from './util';

/**
 * The hover-revealed action rail for a message: an add-reaction picker followed by the context menu.
 * Placement beside the bubble (which side, when it reveals) is owned by the caller's layout.
 */
export function MessageActions({
	message,
	moderationOpts,
	senderProfile,
}: {
	message: ChatBskyConvoDefs.MessageView;
	moderationOpts: ModerationOptions | undefined;
	senderProfile?: AnyProfileView;
}) {
	const convo = useConvoActive();
	const { currentAccount } = useSession();
	const primaryMember = useMaybeProfileShadow(convo.convo.primaryMember);
	const reactionsAvailable = canReact({
		convoState: convo,
		primaryMember,
		moderationOpts,
	});

	const onEmojiSelect = (emoji: string) => {
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
	};

	return (
		<>
			{reactionsAvailable && (
				<EmojiReactionPicker
					message={message}
					onEmojiSelect={onEmojiSelect}
					render={(props) => (
						<button
							{...props}
							aria-label={m['components.dms.reaction.action.add']()}
							className={clsx(props.className, reactionStyles.trigger)}
							type="button"
						>
							<EmojiSmileIcon fill={colors.textContrastMedium} size="lg" />
						</button>
					)}
				/>
			)}
			<MessageContextMenu
				message={message}
				moderationOpts={moderationOpts}
				render={(props) => (
					<button
						{...props}
						aria-label={m['components.dms.message.a11y.options']()}
						className={clsx(props.className, reactionStyles.trigger)}
						type="button"
					>
						<DotsHorizontalIcon fill={colors.textContrastMedium} size="lg" />
					</button>
				)}
				senderProfile={senderProfile}
			/>
		</>
	);
}
