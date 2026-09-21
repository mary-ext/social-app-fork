import { useState } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { isFileDrag, type ThreadDnd } from '../dnd/channel';
import { markDropTarget } from '../dnd/drop-indicators';
import type { PostMedia } from '../editor/schema';
import { MEDIA_GRID_ATTR, MEDIA_ID_ATTR } from '../elements';
import { escapeToEditor, useRovingFocus } from '../focus';
import { createMedia } from './attachments';
import { insertMediaAt } from './commands';
import * as styles from './MediaGrid.css';
import { MediaTile } from './MediaTile';

/** returns the file insertion index at the pointer, or the tile count to append. */
const getFileSlotAt = (grid: HTMLElement, x: number, y: number): number => {
	const rects = [...grid.querySelectorAll(`[${MEDIA_ID_ATTR}]`)].map((tile) => tile.getBoundingClientRect());

	// find the row first so drops after a wrapped row's last tile stay in that row.
	const rowTop = rects.find((rect) => y < rect.bottom)?.top;
	if (rowTop === undefined) {
		return rects.length;
	}

	const inRow = rects.flatMap((rect, index) => (rect.top === rowTop ? [{ rect, index }] : []));
	const before = inRow.find(({ rect }) => x < rect.left + rect.width / 2);
	return before?.index ?? inRow[inRow.length - 1]!.index + 1;
};

/**
 * attachment grid with file drops and drag reordering.
 *
 * @param props post attachments, editor, drag channel, and tab-stop state
 * @returns the grid
 */
export function MediaGrid({
	wg,
	dnd,
	postId,
	media,
	isActive,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	media: readonly PostMedia[];
	isActive: boolean;
}) {
	// insertion index for external files.
	const [slot, setSlot] = useState<number | null>(null);
	const roving = useRovingFocus(
		media.map((item) => item.id),
		isActive,
	);

	const gridRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		// catches attachments dropped on the grid's padding rather than a tile.
		return dnd.dropTarget({
			element: node,
			canDrop: ({ source }) => source.data.kind === 'media',
			getData: () => ({ kind: 'mediaGrid', postId }),
		});
	};

	return (
		<div
			ref={gridRef}
			className={styles.grid}
			{...{ [MEDIA_GRID_ATTR]: '' }}
			onKeyDown={(event) => {
				escapeToEditor(wg, event);
				roving.onKeyDown(event);
			}}
			onDragOver={(event) => {
				if (!isFileDrag(event.dataTransfer)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				// show the grid's insertion line instead of the post outline.
				markDropTarget(wg, null);
				setSlot(getFileSlotAt(event.currentTarget, event.clientX, event.clientY));
			}}
			onDragLeave={(event) => {
				if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
					setSlot(null);
				}
			}}
			onDrop={(event) => {
				if (!isFileDrag(event.dataTransfer)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				setSlot(null);

				const at = getFileSlotAt(event.currentTarget, event.clientX, event.clientY);
				// copy files before the drop event expires.
				const files = [...event.dataTransfer.files];
				void createMedia(files).then((created) => insertMediaAt(wg, postId, at, created.media));
				// restore the caret, which does not redraw while the editor is blurred.
				wg.focus();
			}}
		>
			{media.map((item, index) => (
				<MediaTile
					key={item.id}
					wg={wg}
					dnd={dnd}
					postId={postId}
					index={index}
					item={item}
					roving={roving.item(item.id)}
					insertBefore={slot === index}
					insertAfter={slot === media.length && index === media.length - 1}
				/>
			))}
		</div>
	);
}
