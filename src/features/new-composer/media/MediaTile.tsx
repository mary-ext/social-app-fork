import { type CSSProperties, type ReactNode, useState } from 'react';

import { clsx } from 'clsx';

import { useComposer } from '../context';
import { setDragPreview } from '../dnd/DragPreview';
import type { PostMedia } from '../editor/schema';
import { getMediaTileSelector, MEDIA_ID_ATTR } from '../elements';
import type { RovingItemProps } from '../focus';
import { moveMediaDown, moveMediaUp, nudgeMedia } from './commands';
import * as css from './MediaTile.css';

/**
 * focuses an attachment's tile on the next animation frame, if present.
 *
 * @param mediaId the attachment's id
 */
export const refocusMedia = (mediaId: string): void => {
	requestAnimationFrame(() => {
		document.querySelector<HTMLElement>(getMediaTileSelector(mediaId))?.focus();
	});
};

/**
 * attachment container with drag and keyboard controls.
 *
 * @param props attachment content and interaction controls
 * @returns the tile
 */
export function MediaTile({
	postId,
	index,
	item,
	label,
	dragPreview,
	roving,
	className,
	style,
	onRemove,
	children,
}: {
	postId: string;
	index: number;
	item: PostMedia;
	label: string;
	dragPreview: ReactNode;
	roving: RovingItemProps;
	className?: string;
	style?: CSSProperties;
	/** called on Delete or Backspace while the tile is focused. */
	onRemove: () => void;
	children: ReactNode;
}) {
	const { wg, dnd } = useComposer();
	const [isDragging, setIsDragging] = useState(false);

	const tileRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		return dnd.draggable({
			element: node,
			getInitialData: () => ({ kind: 'media', postId, mediaId: item.id, mediaKind: item.kind, index }),
			onGenerateDragPreview: ({ nativeSetDragImage }) => {
				setDragPreview(nativeSetDragImage, dragPreview);
			},
			onDragStart: () => setIsDragging(true),
			onDrop: () => setIsDragging(false),
		});
	};

	return (
		<div
			ref={tileRef}
			{...roving}
			className={clsx(css.tile, className, isDragging && css.dragging)}
			style={style}
			role="group"
			aria-label={label}
			{...{ [MEDIA_ID_ATTR]: item.id }}
			onKeyDown={(event) => {
				// preserve keyboard handling in the tile's controls.
				if (event.target !== event.currentTarget) {
					return;
				}

				if (event.key === 'Backspace' || event.key === 'Delete') {
					event.preventDefault();
					onRemove();
					return;
				}

				if (!event.altKey) {
					return;
				}

				switch (event.key) {
					case 'ArrowLeft': {
						nudgeMedia(wg, postId, item.id, -1);
						refocusMedia(item.id);
						break;
					}
					case 'ArrowRight': {
						nudgeMedia(wg, postId, item.id, 1);
						refocusMedia(item.id);
						break;
					}
					case 'ArrowUp': {
						moveMediaUp(wg, postId, item.id);
						refocusMedia(item.id);
						break;
					}
					case 'ArrowDown': {
						moveMediaDown(wg, postId, item.id);
						refocusMedia(item.id);
						break;
					}
					default: {
						return;
					}
				}

				event.preventDefault();
				event.stopPropagation();
			}}
		>
			{children}
		</div>
	);
}
