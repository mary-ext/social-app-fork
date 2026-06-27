import { type ComponentProps, useState } from 'react';
import type { ChatBskyConvoDefs } from '@atcute/bluesky';
import { Popover } from '@base-ui/react/popover';
import { clsx } from 'clsx';

import { useSession } from '#/state/session';

import { EmojiPanel } from '#/components/EmojiPicker/EmojiPanel';
import { useWebPreloadEmoji } from '#/components/EmojiPicker/preload';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';

import { m } from '#/paraglide/messages';

import * as styles from './EmojiReactionPicker.css';
import { hasAlreadyReacted, hasReachedReactionLimit } from './util';

const QUICK_REACTIONS = ['❤️', '👍', '😆', '👀', '😢'];

export function EmojiReactionPicker({
	message,
	render,
	onEmojiSelect,
}: {
	message: ChatBskyConvoDefs.MessageView;
	/** The trigger element (a message-hover button); receives Base UI trigger props + `{ open }` state. */
	render: ComponentProps<typeof Popover.Trigger>['render'];
	onEmojiSelect: (emoji: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const preloadEmoji = useWebPreloadEmoji();

	const handleSelect = (emoji: string) => {
		setOpen(false);
		onEmojiSelect(emoji);
	};

	return (
		<Popover.Root
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) {
					preloadEmoji();
				} else {
					// back to quick reactions next time it opens
					setExpanded(false);
				}
			}}
		>
			<Popover.Trigger render={render} />
			<Popover.Portal>
				<Popover.Positioner sideOffset={5} collisionPadding={{ bottom: 5, left: 5, right: 5 }}>
					<Popover.Popup className={styles.popup}>
						{expanded ? (
							<EmojiPanel onEmojiSelect={(emoji) => handleSelect(emoji.native)} />
						) : (
							<QuickReactions message={message} onSelect={handleSelect} onExpand={() => setExpanded(true)} />
						)}
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

function QuickReactions({
	message,
	onSelect,
	onExpand,
}: {
	message: ChatBskyConvoDefs.MessageView;
	onSelect: (emoji: string) => void;
	onExpand: () => void;
}) {
	const { currentAccount } = useSession();
	const limitReached = hasReachedReactionLimit(message, currentAccount?.did);

	return (
		<div className={styles.quickRow}>
			{QUICK_REACTIONS.map((emoji) => {
				const alreadyReacted = hasAlreadyReacted(message, currentAccount?.did, emoji);
				return (
					<button
						key={emoji}
						type="button"
						aria-label={emoji}
						className={clsx(
							styles.reaction,
							alreadyReacted && styles.reactionSelected,
							limitReached && !alreadyReacted && styles.reactionDisabled,
						)}
						onClick={() => onSelect(emoji)}
					>
						{}
						<span className={styles.reactionGlyph}>{emoji}</span>
					</button>
				);
			})}
			<button
				type="button"
				aria-label={m['components.dms.action.moreEmojis']()}
				className={styles.expandButton}
				onClick={onExpand}
			>
				<PlusIcon size="md" fill="currentColor" />
			</button>
		</div>
	);
}
