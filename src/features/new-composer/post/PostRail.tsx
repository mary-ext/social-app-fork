import { type MouseEvent, type ReactNode, useRef } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { BaseUIEvent } from '@base-ui/react';
import type { Wordgard } from 'wordgard/editor';

import { toImageCdnUrl } from '#/lib/bsky-cdn';

import { useCurrentAccountProfile } from '#/state/queries/profile';

import * as Menu from '#/components/Menu';

import ArrowDownIcon from '#/icons/central/ArrowDown_round_outlined_radius1_stroke2.svg';
import ArrowUpIcon from '#/icons/central/ArrowUp_round_outlined_radius1_stroke2.svg';
import GripIcon from '#/icons/central/DotGrid2x3_round_outlined_radius1_stroke2.svg';

import { movePostToSlot } from '../commands/reorder-posts';
import { useComposer, useEditor, usePostCount, usePostState } from '../context';
import { DragChip, setDragPreview } from '../dnd/DragPreview';
import { findPostById, getPostText } from '../model/schema';
import { refocusSoon } from '../shared/editor-focus';
import { getPostHandleSelector, POST_HANDLE_ATTR } from '../shared/elements';
import { Avatar } from './Avatar';
import * as css from './PostRail.css';

/**
 * post gutter with an avatar, reorder controls, and thread line.
 *
 * @param props the post's id
 * @returns the post's rail
 */
export function PostRail({ postId }: { postId: string }) {
	const profile = useCurrentAccountProfile();
	const isThread = usePostCount() > 1;

	return (
		<div className={css.root}>
			{isThread ? <PostHandle postId={postId} /> : <Avatar profile={profile} />}
			<div className={css.line} />
		</div>
	);
}

// defer Base UI's menu opening until click so pointer down can start a drag.
const deferToClick = (event: BaseUIEvent<MouseEvent<HTMLButtonElement>>) => {
	event.preventBaseUIHandler();
};

const getPostDragPreview = (
	wg: Wordgard,
	postId: string,
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined,
): ReactNode => {
	const post = findPostById(wg.state.doc, postId);
	const text = post ? getPostText(post.node).replaceAll('\n', ' ').trim() : '';
	// the preview is snapshotted immediately; reuse the thumbnail the rail already loaded.
	const avatar = profile?.avatar && toImageCdnUrl(profile.avatar, 'avatar_thumbnail');
	return <DragChip avatar={avatar} label={text || 'Empty post'} />;
};

function PostHandle({ postId }: { postId: string }) {
	const { wg, dnd } = useComposer();
	const profile = useCurrentAccountProfile();

	// cancelled drags skip the drop handler's focus restoration. restore only prior focus
	// to avoid placing a gap cursor before the first post.
	const hadFocus = useRef(false);

	const handleRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		return dnd.draggable({
			element: node,
			canDrag() {
				return !wg.state.readOnly;
			},
			getInitialData() {
				return {
					kind: 'post',
					postId,
					index: findPostById(wg.state.doc, postId)?.index ?? -1,
				};
			},
			onGenerateDragPreview({ nativeSetDragImage }) {
				setDragPreview(nativeSetDragImage, getPostDragPreview(wg, postId, profile));
			},
		});
	};

	return (
		<Menu.Root>
			<Menu.Trigger
				ref={handleRef}
				className={css.handle}
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
				<span className={css.handleOverlay}>
					<GripIcon className={css.handleIcon} />
				</span>
			</Menu.Trigger>

			<Menu.Popup label="Reorder this post" align="start">
				<ReorderItems postId={postId} />
			</Menu.Popup>
		</Menu.Root>
	);
}

function ReorderItems({ postId }: { postId: string }) {
	const wg = useEditor();
	const index = usePostState(postId, (_state, post) => post.index, -1);
	const total = usePostCount();

	const move = (to: number) => {
		movePostToSlot(wg, postId, to);
		// moving a post replaces its handle; refocus the replacement for keyboard reordering.
		refocusSoon(getPostHandleSelector(postId));
	};

	return (
		<Menu.Group>
			<Menu.Item onClick={() => move(index - 1)} disabled={index <= 0}>
				<Menu.ItemText>Move up</Menu.ItemText>
				<Menu.ItemIcon position="right" icon={ArrowUpIcon} />
			</Menu.Item>
			<Menu.Item onClick={() => move(index + 1)} disabled={index === -1 || index === total - 1}>
				<Menu.ItemText>Move down</Menu.ItemText>
				<Menu.ItemIcon position="right" icon={ArrowDownIcon} />
			</Menu.Item>
		</Menu.Group>
	);
}
