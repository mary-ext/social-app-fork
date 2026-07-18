import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Autocomplete } from '@base-ui/react/autocomplete';

import { Text } from '#/components/Text';

import { CATEGORY_LABELS } from '../categories';
import { type EmojiLayout, GRID_HEIGHT, OVERSCAN } from '../layout';
import type { EmojiCell } from '../util';
import * as styles from './EmojiGrid.css';

/** imperative handle the panel uses to drive the grid's scroll position. */
export type EmojiGridHandle = {
	ensureVisible: (index: number) => void;
	scrollToSection: (key: string) => void;
};

type EmojiGridProps = {
	cells: EmojiCell[];
	layout: EmojiLayout;
	/** reports the section currently scrolled to the top of the viewport. */
	onActiveSectionChange: (key: string | null) => void;
	onSelect: (cell: EmojiCell, shiftHeld: boolean) => void;
};

/** the virtualized emoji grid, rendering only the rows within the viewport (plus {@link OVERSCAN}). */
export function EmojiGrid({
	cells,
	layout,
	onActiveSectionChange,
	onSelect,
	ref,
}: EmojiGridProps & { ref?: React.Ref<EmojiGridHandle> }) {
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
				const row = layout.rows[rowIndex]!;
				if (row.top < el.scrollTop) {
					el.scrollTop = row.top;
				} else if (row.top + row.height > el.scrollTop + GRID_HEIGHT) {
					el.scrollTop = row.top + row.height - GRID_HEIGHT;
				}
			},
			scrollToSection(key) {
				const rowIndex = layout.sectionRowIndex.get(key);
				if (rowIndex == null || !scrollRef.current) {
					return;
				}
				scrollRef.current.scrollTop = layout.rows[rowIndex]!.top;
			},
		}),
		[layout],
	);

	// reset to the top whenever the layout changes (a new search or a different category set)
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = 0;
		}
		// oxlint-disable-next-line react/react-compiler -- guarded reset when the layout changes, not a per-render cascade
		setScrollTop(0);
	}, [layout]);

	// the section whose header sits at (or just above) the top of the viewport — what the nav highlights.
	// at the very bottom the last section wins even if its short body never reaches the top.
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
				if (section.top > scrollTop + 1) {
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
								const index = row.firstIndex + col;
								const cell = cells[index];
								if (!cell) {
									return null;
								}
								return (
									<Autocomplete.Item
										aria-label={cell.emoji.name}
										aria-posinset={index + 1}
										aria-setsize={cells.length}
										className={styles.cell}
										index={index}
										key={cell.key}
										onClick={(event) => onSelect(cell, event.shiftKey)}
										value={cell}
									>
										<span className={styles.glyph}>{cell.native}</span>
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
