import { memo, type MouseEvent, useRef } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { BaseUIEvent } from '@base-ui/react';
import type { Wordgard } from 'wordgard/editor';

import * as Menu from '#/components/Menu';
import { UserAvatar } from '#/components/UserAvatar';

import ArrowDownIcon from '#/icons/central/ArrowDown_round_outlined_radius1_stroke2.svg';
import ArrowUpIcon from '#/icons/central/ArrowUp_round_outlined_radius1_stroke2.svg';
import GripIcon from '#/icons/central/DotGrid2x3_round_outlined_radius1_stroke2.svg';

import { movePostToSlot } from './commands';
import type { ThreadDnd } from './dnd';
import { POST_HANDLE_ATTR } from './elements';
import * as styles from './PostRail.css';

type RailProps = {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	index: number;
	total: number;
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
};

function Avatar({
	profile,
	noBorder,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
	noBorder?: boolean;
}) {
	return (
		<UserAvatar
			avatar={profile?.avatar}
			size={styles.AVATAR_SIZE}
			type={profile?.associated?.labeler ? 'labeler' : 'user'}
			noBorder={noBorder}
		/>
	);
}

/**
 * post gutter with an avatar, reorder controls, and thread line.
 *
 * @param props editor, drag channel, post position and id, and author profile
 * @returns the post's rail
 */
export const PostRail = memo(function PostRail(props: RailProps) {
	const { index, total, profile } = props;

	return (
		<div className={styles.root}>
			{total > 1 ? <PostHandle {...props} /> : <Avatar profile={profile} />}
			{index < total - 1 && <div className={styles.line} />}
		</div>
	);
});

// defer Base UI's menu opening until click so pointer down can start a drag.
const deferToClick = (event: BaseUIEvent<MouseEvent<HTMLButtonElement>>) => {
	event.preventBaseUIHandler();
};

// moving a post replaces its handle; refocus the replacement for keyboard reordering.
const refocusHandle = (postId: string) => {
	requestAnimationFrame(() => {
		document.querySelector<HTMLElement>(`[${POST_HANDLE_ATTR}="${CSS.escape(postId)}"]`)?.focus();
	});
};

function PostHandle({ wg, dnd, postId, index, total, profile }: RailProps) {
	// cancelled drags skip the drop handler's focus restoration. restore only prior focus
	// to avoid placing a gap cursor before the first post.
	const hadFocus = useRef(false);

	const handleRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		return dnd.draggable({
			element: node,
			getInitialData: () => ({ kind: 'post', postId, index }),
		});
	};

	const move = (to: number) => {
		movePostToSlot(wg, postId, to);
		refocusHandle(postId);
	};

	return (
		<Menu.Root>
			<Menu.Trigger
				ref={handleRef}
				className={styles.handle}
				aria-label="Reorder this post"
				// keyboard users reorder from the text with Alt-ArrowUp/ArrowDown.
				tabIndex={-1}
				{...{ [POST_HANDLE_ATTR]: postId }}
				onMouseDown={(event) => {
					deferToClick(event);
					hadFocus.current = wg.hasFocus;
				}}
				onPointerDown={deferToClick}
				onDragEnd={() => {
					if (hadFocus.current) {
						wg.focus();
					}
				}}
			>
				<Avatar profile={profile} noBorder />
				<span className={styles.handleOverlay}>
					<GripIcon className={styles.handleIcon} />
				</span>
			</Menu.Trigger>

			<Menu.Popup label="Reorder this post" align="start">
				<Menu.Group>
					<Menu.Item onClick={() => move(index - 1)} disabled={index === 0}>
						<Menu.ItemText>Move up</Menu.ItemText>
						<Menu.ItemIcon position="right" icon={ArrowUpIcon} />
					</Menu.Item>
					<Menu.Item onClick={() => move(index + 1)} disabled={index === total - 1}>
						<Menu.ItemText>Move down</Menu.ItemText>
						<Menu.ItemIcon position="right" icon={ArrowDownIcon} />
					</Menu.Item>
				</Menu.Group>
			</Menu.Popup>
		</Menu.Root>
	);
}
