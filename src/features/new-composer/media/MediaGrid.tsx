import { useLayoutEffect, useRef } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { CAROUSEL_MAX_HEIGHT, CAROUSEL_MIN_HEIGHT } from '#/components/ImageEmbed/carousel/const';
import { PagingControls } from '#/components/ImageEmbed/carousel/PagingControls';
import { getStripStyle } from '#/components/ImageEmbed/carousel/strip';

import { space } from '#/styles/tokens.css';

import type { ThreadDnd } from '../dnd/channel';
import type { PostMedia } from '../editor/schema';
import { MEDIA_GRID_ATTR, MEDIA_ID_ATTR, MEDIA_ROW_ATTR } from '../elements';
import { escapeToEditor, keepEditorFocus, useRovingFocus } from '../focus';
import { RAIL_WIDTH } from '../layout';
import * as styles from './MediaGrid.css';
import { type MediaLayout, MediaTile } from './MediaTile';

type Box = { left: number; top: number; width: number; height: number; isRow: boolean };

const getBox = (tile: HTMLElement): Box => ({
	left: tile.offsetLeft,
	top: tile.offsetTop,
	width: tile.offsetWidth,
	height: tile.offsetHeight,
	isRow: tile.hasAttribute(MEDIA_ROW_ATTR),
});

// the single-image layout has no gap; space its drop line as the grid would.
const getGap = (value: string) => {
	const gap = parseFloat(value);
	return Number.isNaN(gap) || gap === 0 ? space.xs : gap;
};

/** centers the insertion line in the gap before `slot`. */
const placeDropLine = (grid: HTMLElement, line: HTMLElement, slot: number): void => {
	const tiles = [...grid.querySelectorAll<HTMLElement>(`[${MEDIA_ID_ATTR}]`)];
	const prev = tiles[slot - 1];
	const next = tiles[slot];

	const computed = getComputedStyle(grid);
	const columnGap = getGap(computed.columnGap);
	const rowGap = getGap(computed.rowGap);
	const thickness = styles.DROP_LINE_THICKNESS;

	const horizontal = (box: Box, y: number) => {
		Object.assign(line.style, {
			left: `${box.left}px`,
			top: `${y - thickness / 2}px`,
			width: `${box.width}px`,
			height: `${thickness}px`,
		});
	};
	const vertical = (box: Box, x: number) => {
		Object.assign(line.style, {
			left: `${x - thickness / 2}px`,
			top: `${box.top}px`,
			width: `${thickness}px`,
			height: `${box.height}px`,
		});
	};

	const before = next && getBox(next);
	const after = prev && getBox(prev);

	if (before?.isRow) {
		horizontal(before, before.top - rowGap / 2);
	} else if (before) {
		if (after && !after.isRow && after.top === before.top) {
			vertical(before, (after.left + after.width + before.left) / 2);
		} else {
			vertical(before, before.left - columnGap / 2);
		}
	} else if (after?.isRow) {
		horizontal(after, after.top + after.height + rowGap / 2);
	} else if (after) {
		vertical(after, after.left + after.width + columnGap / 2);
	}
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
 * attachment grid with drag reordering.
 *
 * @param props attachments, editor, drag state, and keyboard focus state
 * @returns the grid
 */
export function MediaGrid({
	wg,
	dnd,
	postId,
	media,
	isActive,
	dropSlot,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	media: readonly PostMedia[];
	isActive: boolean;
	dropSlot: number | null;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const lineRef = useRef<HTMLDivElement>(null);
	const roving = useRovingFocus(
		media.map((item) => item.id),
		isActive,
	);
	const layout = getMediaLayout(media);

	// remeasure every render to track tile changes during a drag.
	useLayoutEffect(() => {
		if (scrollRef.current && lineRef.current && dropSlot !== null) {
			placeDropLine(scrollRef.current, lineRef.current, dropSlot);
		}
	});

	const grid = (
		<div
			ref={scrollRef}
			className={LAYOUT_CLASSES[layout]}
			{...{ [MEDIA_GRID_ATTR]: '' }}
			onKeyDown={(event) => {
				escapeToEditor(wg, event);
				roving.onKeyDown(event);
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
				/>
			))}
			{/* mounted only during drags, since carousel paging treats every child as a tile. */}
			{dropSlot !== null && <div ref={lineRef} className={styles.dropLine} aria-hidden />}
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
