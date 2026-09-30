import { useRef, useState } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { CAROUSEL_MAX_HEIGHT, CAROUSEL_MIN_HEIGHT } from '#/components/ImageEmbed/carousel/const';
import { PagingControls } from '#/components/ImageEmbed/carousel/PagingControls';
import { getStripStyle } from '#/components/ImageEmbed/carousel/strip';

import { isFileDrag, type ThreadDnd } from '../dnd/channel';
import { markDropTarget } from '../dnd/drop-indicators';
import type { PostMedia } from '../editor/schema';
import { MEDIA_GRID_ATTR, MEDIA_ID_ATTR, MEDIA_ROW_ATTR } from '../elements';
import { escapeToEditor, keepEditorFocus, useRovingFocus } from '../focus';
import { RAIL_WIDTH } from '../layout';
import { createMedia } from './attachments';
import { insertMediaAt } from './commands';
import * as styles from './MediaGrid.css';
import { type MediaLayout, MediaTile } from './MediaTile';

/** returns the file insertion index at the pointer, or the tile count to append. */
const getFileSlotAt = (grid: HTMLElement, x: number, y: number): number => {
	const tiles = [...grid.querySelectorAll(`[${MEDIA_ID_ATTR}]`)].map((tile, index) => ({
		rect: tile.getBoundingClientRect(),
		index,
		isRow: tile.hasAttribute(MEDIA_ROW_ATTR),
	}));

	// find the row first so drops after a wrapped row's last tile stay in that row.
	const rowTop = tiles.find(({ rect }) => y < rect.bottom)?.rect.top;
	if (rowTop === undefined) {
		return tiles.length;
	}

	const inRow = tiles.filter(({ rect }) => rect.top === rowTop);

	const [first] = inRow;
	if (first?.isRow) {
		return y < first.rect.top + first.rect.height / 2 ? first.index : first.index + 1;
	}

	const before = inRow.find(({ rect }) => x < rect.left + rect.width / 2);
	return before?.index ?? inRow[inRow.length - 1]!.index + 1;
};

// match published image layouts; use the grid for other attachments.
const getMediaLayout = (media: readonly PostMedia[]): MediaLayout => {
	if (!media.every((item) => item.kind === 'image')) {
		return 'grid';
	}

	return media.length === 1 ? 'single' : 'strip';
};

const LAYOUT_CLASSES: Record<MediaLayout, string> = {
	grid: styles.grid,
	single: styles.single,
	strip: styles.stripScroll,
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
	const scrollRef = useRef<HTMLDivElement>(null);
	const roving = useRovingFocus(
		media.map((item) => item.id),
		isActive,
	);
	const layout = getMediaLayout(media);

	const gridRef = (node: HTMLDivElement | null) => {
		scrollRef.current = node;
		if (!node) {
			return;
		}

		// catches attachments dropped on the grid's padding rather than a tile.
		const stopDropping = dnd.dropTarget({
			element: node,
			canDrop: ({ source }) => source.data.kind === 'media',
			getData: () => ({ kind: 'mediaGrid', postId }),
		});

		return () => {
			scrollRef.current = null;
			stopDropping();
		};
	};

	const grid = (
		<div
			ref={gridRef}
			className={LAYOUT_CLASSES[layout]}
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
					layout={layout}
					roving={roving.item(item.id)}
					insertBefore={slot === index}
					insertAfter={slot === media.length && index === media.length - 1}
				/>
			))}
		</div>
	);

	if (layout !== 'strip') {
		return grid;
	}

	return (
		<div
			className={styles.stripRoot}
			style={getStripStyle({
				max: CAROUSEL_MAX_HEIGHT,
				min: CAROUSEL_MIN_HEIGHT,
				ratios: media.map((item) => (item.kind === 'image' ? item.aspectRatio : undefined)),
			})}
		>
			{grid}
			<div className={styles.paging} onMouseDown={keepEditorFocus}>
				<PagingControls scrollPaddingLeft={RAIL_WIDTH} scrollRef={scrollRef} />
			</div>
		</div>
	);
}
