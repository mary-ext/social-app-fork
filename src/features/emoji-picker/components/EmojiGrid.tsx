import { type Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Autocomplete } from '@base-ui/react/autocomplete';

import { Text } from '#/components/Text';

import type { SkinTone } from '#/storage/schema';

import { CATEGORY_LABELS } from '../categories';
import type { EmojiDataset } from '../data';
import {
	type EmojiLayout,
	GRID_HEIGHT,
	GRID_SCROLL_PADDING_BOTTOM,
	GRID_SCROLL_PADDING_TOP,
	OVERSCAN,
	SEARCH_INPUT_RADIUS,
} from '../layout';
import * as styles from './EmojiGrid.css';

/** imperative handle the panel uses to drive the grid's scroll position. */
export type EmojiGridHandle = {
	ensureVisible: (index: number) => void;
	scrollToSection: (key: string) => void;
	scrollToTop: () => void;
};

type EmojiGridProps = {
	cells: number[];
	dataset: EmojiDataset;
	layout: EmojiLayout;
	/** reports the section currently scrolled to the top of the viewport. */
	onActiveSectionChange: (key: string | null) => void;
	onSelect: (emojiIndex: number, shiftHeld: boolean) => void;
	skinTone: SkinTone;
};

/** the virtualized emoji grid, rendering only the rows within the viewport (plus {@link OVERSCAN}). */
export function EmojiGrid({
	cells,
	dataset,
	layout,
	onActiveSectionChange,
	onSelect,
	ref,
	skinTone,
}: EmojiGridProps & { ref?: Ref<EmojiGridHandle> }) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);

	useImperativeHandle(
		ref,
		() => ({
			ensureVisible(index) {
				const rowIndex = layout.rowIndexForEmoji[index];
				const el = scrollRef.current;
				if (rowIndex == null || !el) {
					return;
				}

				// virtualized rows may not have DOM nodes, so use layout offsets.
				const row = layout.rows[rowIndex]!;

				// keep an adjacent section header visible with its first row.
				const header = layout.rows[rowIndex - 1];
				const headed = header?.type === 'header';
				const top = headed ? header.top : row.top;

				const overflowTop = el.scrollTop + (headed ? SEARCH_INPUT_RADIUS : GRID_SCROLL_PADDING_TOP) - top;
				const overflowBottom =
					row.top + row.height - (el.scrollTop + el.clientHeight - GRID_SCROLL_PADDING_BOTTOM);

				const overflowsTop = overflowTop > 0;
				const overflowsBottom = overflowBottom > 0;

				if (overflowsTop === overflowsBottom) {
					return;
				}

				el.scrollTop += overflowsTop ? -overflowTop : overflowBottom;
			},
			scrollToSection(key) {
				const rowIndex = layout.sectionRowIndex.get(key);
				if (rowIndex == null || !scrollRef.current) {
					return;
				}
				// align the header with the grid's initial resting position.
				scrollRef.current.scrollTop = layout.rows[rowIndex]!.top - SEARCH_INPUT_RADIUS;
			},
			scrollToTop() {
				if (scrollRef.current) {
					scrollRef.current.scrollTop = 0;
				}
			},
		}),
		[layout],
	);

	// highlight the section at the top of the unobscured viewport.
	// at the very bottom the last section wins even if its short body never reaches the top.
	const visibleTop = scrollTop + SEARCH_INPUT_RADIUS + 1;
	const sections = Array.from(layout.sectionRowIndex, ([key, rowIndex]) => {
		return {
			key,
			top: layout.rows[rowIndex]!.top,
		};
	});

	let activeSection: string | null = null;
	if (sections.length) {
		if (scrollTop + GRID_HEIGHT >= layout.totalHeight) {
			activeSection = sections[sections.length - 1]!.key;
		} else {
			activeSection = sections[0]!.key;
			for (const section of sections) {
				if (section.top > visibleTop) {
					break;
				}
				activeSection = section.key;
			}
		}
	}

	useEffect(() => {
		onActiveSectionChange(activeSection);
	}, [activeSection, onActiveSectionChange]);

	const visible = layout.rows.filter(
		(row) => row.top + row.height > scrollTop - OVERSCAN && row.top < scrollTop + GRID_HEIGHT + OVERSCAN,
	);

	return (
		<div
			tabIndex={-1}
			className={styles.scroll}
			onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
			ref={scrollRef}
			role="presentation"
		>
			<div className={styles.spacer} role="presentation" style={{ height: layout.totalHeight }}>
				{visible.map((row) =>
					row.type === 'header' ? (
						<div className={styles.header} key={row.key} style={{ height: row.height, top: row.top }}>
							<Text size="md_sub" weight="semiBold" color="textContrastMedium">
								{CATEGORY_LABELS[row.key]!()}
							</Text>
						</div>
					) : (
						<Autocomplete.Row
							className={styles.row}
							key={row.key}
							style={{ height: row.height, top: row.top }}
						>
							{Array.from({ length: row.count }, (_, col) => {
								const position = row.firstIndex + col;
								const emojiIndex = cells[position];
								if (emojiIndex === undefined) {
									return null;
								}
								return (
									<Autocomplete.Item
										aria-label={dataset.names[emojiIndex]}
										aria-posinset={position + 1}
										aria-setsize={cells.length}
										className={styles.cell}
										index={position}
										key={col}
										onClick={(event) => onSelect(emojiIndex, event.shiftKey)}
										value={emojiIndex}
									>
										<span className={styles.glyph}>{dataset.nativeAt(emojiIndex, skinTone)}</span>
									</Autocomplete.Item>
								);
							})}
						</Autocomplete.Row>
					),
				)}
			</div>
		</div>
	);
}
