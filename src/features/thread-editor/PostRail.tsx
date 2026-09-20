import { useRef } from 'react';

import type { Wordgard } from 'wordgard/editor';

import type { ThreadDnd } from './dnd';
import * as styles from './PostRail.css';

function GripIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
			{[4, 8, 12].map((cy) => (
				<g key={cy}>
					<circle cx="6" cy={cy} r="1.35" />
					<circle cx="10" cy={cy} r="1.35" />
				</g>
			))}
		</svg>
	);
}

/**
 * post gutter with a drag handle, avatar, and thread line.
 *
 * @param props the editor, the post's id and position in the thread, and the author's avatar URL
 * @returns the post's rail
 */
export function PostRail({
	wg,
	dnd,
	postId,
	index,
	total,
	avatar,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	index: number;
	total: number;
	avatar?: string;
}) {
	// the grip must allow mousedown for dragging. restore focus only if the editor had it,
	// otherwise it may place a gap cursor before the first post.
	const hadFocus = useRef(false);

	const gripRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		return dnd.draggable({
			element: node,
			getInitialData: () => ({ kind: 'post', postId, index }),
		});
	};

	return (
		<div className={styles.root}>
			{total > 1 && (
				<div
					ref={gripRef}
					className={styles.grip}
					role="button"
					tabIndex={0}
					aria-label="Drag to reorder this post"
					onMouseDown={() => {
						hadFocus.current = wg.hasFocus;
					}}
					onDragEnd={() => {
						if (hadFocus.current) {
							wg.focus();
						}
					}}
					onClick={() => {
						if (hadFocus.current) {
							wg.focus();
						}
					}}
				>
					<GripIcon />
				</div>
			)}

			<div className={styles.thread}>
				<div
					className={styles.avatar}
					style={avatar ? { backgroundImage: `url(${JSON.stringify(avatar)})` } : undefined}
				/>
				{index < total - 1 && <div className={styles.line} />}
			</div>
		</div>
	);
}
