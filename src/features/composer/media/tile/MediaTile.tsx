import { type CSSProperties, type ReactNode, useState } from 'react';

import { clsx } from 'clsx';

import { type CompositeItemProps, useCompositeItem } from '#/components/primitives/composite';

import { useComposer } from '../../context';
import { setDragPreview } from '../../dnd/DragPreview';
import type { PostMedia } from '../../model/schema';
import { refocusSoon } from '../../shared/editor-focus';
import { getMediaTileSelector, MEDIA_ID_ATTR } from '../../shared/elements';
import { moveMediaDown, moveMediaUp, nudgeMedia } from '../commands';
import * as css from './MediaTile.css';

/**
 * focuses an attachment's tile on the next animation frame, if present.
 *
 * @param mediaId the attachment's id
 */
export const refocusMedia = (mediaId: string): void => {
	refocusSoon(getMediaTileSelector(mediaId));
};

/**
 * joins the media row's roving tab order.
 *
 * @returns composite props for `MediaTile` and whether its controls are tabbable
 */
export const useMediaTileComposite = (): { composite: CompositeItemProps | undefined; tabbable: boolean } => {
	const composite = useCompositeItem({ active: false, disabled: false });
	return { composite, tabbable: composite?.tabIndex === 0 };
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
	composite,
	className,
	style,
	onRemove,
	onTogglePlayback,
	children,
}: {
	postId: string;
	index: number;
	item: PostMedia;
	label: string;
	dragPreview: ReactNode;
	composite: CompositeItemProps | undefined;
	className?: string;
	style?: CSSProperties;
	/** called on Delete or Backspace while the tile is focused. */
	onRemove: () => void;
	/** called on Space while the tile is focused. */
	onTogglePlayback?: () => void;
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
			canDrag() {
				return !wg.state.readOnly;
			},
			getInitialData() {
				return { kind: 'media', postId, mediaId: item.id, mediaKind: item.kind, index };
			},
			onGenerateDragPreview({ nativeSetDragImage }) {
				setDragPreview(nativeSetDragImage, dragPreview);
			},
			onDragStart() {
				setIsDragging(true);
			},
			onDrop() {
				setIsDragging(false);
			},
		});
	};

	return (
		<div
			ref={tileRef}
			{...composite}
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

				if (event.key === ' ') {
					event.preventDefault();
					onTogglePlayback?.();
					return;
				}

				// onRemove also moves focus, even if the edit is blocked.
				if (wg.state.readOnly) {
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

				const ref = { postId, mediaId: item.id };
				switch (event.key) {
					case 'ArrowLeft': {
						nudgeMedia(wg, ref, -1);
						break;
					}
					case 'ArrowRight': {
						nudgeMedia(wg, ref, 1);
						break;
					}
					case 'ArrowUp': {
						moveMediaUp(wg, ref);
						break;
					}
					case 'ArrowDown': {
						moveMediaDown(wg, ref);
						break;
					}
					default: {
						return;
					}
				}

				refocusMedia(item.id);
				event.preventDefault();
				event.stopPropagation();
			}}
		>
			{children}
		</div>
	);
}
