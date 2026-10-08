import { type ReactElement, useState } from 'react';

import type { ChatBskyConvoDefs } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { useSession } from '#/state/session';

import { EmojiPanel } from '#/features/emoji-picker/EmojiPanel';
import { useEmojiPreload } from '#/features/emoji-picker/preload';

import * as Popover from '#/components/primitives/popover';

import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
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
	/** popover trigger. */
	render: ReactElement;
	onEmojiSelect: (emoji: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const preloadEmoji = useEmojiPreload();

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
			<Popover.Positioner sideOffset={5} collisionPadding={{ bottom: 5, left: 5, right: 5 }}>
				<Popover.Popup className={styles.popup}>
					{expanded ? (
						<EmojiPanel onEmojiSelect={(emoji) => handleSelect(emoji.native)} />
					) : (
						<QuickReactions message={message} onSelect={handleSelect} onExpand={() => setExpanded(true)} />
					)}
				</Popover.Popup>
			</Popover.Positioner>
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
				aria-label={m['components.dms.reaction.action.more']()}
				className={styles.expandButton}
				onClick={onExpand}
			>
				<PlusIcon className={styles.plusIcon} />
			</button>
		</div>
	);
}
