/** columns per emoji row. */
export const PER_LINE = 9;
/** height of a single emoji row in px; also the square cell's width. */
export const ROW_HEIGHT = 36;
/** height of a category header row, in px. */
export const HEADER_HEIGHT = 32;
/** visible height of the scrolling grid, in px. */
export const GRID_HEIGHT = 256;
/** extra px rendered above and below the viewport. */
export const OVERSCAN = 80;
/** inline padding inside the scrolling grid, in px. */
export const GRID_PADDING = 8;
/** padding below the last row of the scrolling grid, in px. */
export const GRID_PADDING_BOTTOM = 8;
/**
 * corner radius of the search input, in px. the grid slides up under the input by this amount (via a negative
 * margin) so its rounded bottom overlaps the scrolling content, so the layout offsets every row's top by the
 * same amount to compensate.
 */
export const SEARCH_INPUT_RADIUS = 10;
/** inner content width: {@link PER_LINE} cells plus the grid's inline padding. */
export const PANEL_WIDTH = PER_LINE * ROW_HEIGHT + GRID_PADDING * 2;

/** a section of the picker: a labeled category, or an unlabeled flat list (search results). */
export type EmojiSection = {
	count: number;
	key: string;
	/** whether the section gets a header row. */
	labeled?: boolean;
};

/** a laid-out row in the grid, positioned absolutely by {@link EmojiRow.top}. */
export type EmojiRow =
	| { type: 'header'; key: string; top: number; height: number }
	| { type: 'emojis'; key: string; top: number; height: number; firstIndex: number; count: number };

/** the full vertical layout of the grid: positioned rows plus lookups for scrolling. */
export type EmojiLayout = {
	rows: EmojiRow[];
	totalHeight: number;
	/** flat emoji index → index into {@link EmojiLayout.rows}. */
	rowIndexForEmoji: number[];
	/** section key → index into {@link EmojiLayout.rows} of that section's first row. */
	sectionRowIndex: Map<string, number>;
};

/**
 * lays sections out into absolutely-positioned rows of fixed height, assigning each emoji a flat index
 * matching its position in the flattened emoji list.
 *
 * @param sections the sections to lay out, in order
 * @returns the row layout and scroll lookups
 */
export function buildEmojiLayout(sections: readonly EmojiSection[]): EmojiLayout {
	const rows: EmojiRow[] = [];
	const rowIndexForEmoji: number[] = [];
	const sectionRowIndex = new Map<string, number>();
	let top = SEARCH_INPUT_RADIUS;
	let flat = 0;

	for (const section of sections) {
		// only register a section once it has a row to anchor to: an unlabeled, empty section (a
		// search that matched nothing) contributes neither header nor emoji rows, so a map entry
		// would point past the end of `rows`.
		const sectionStart = rows.length;
		if (section.labeled) {
			rows.push({ height: HEADER_HEIGHT, key: section.key, top, type: 'header' });
			top += HEADER_HEIGHT;
		} else {
			// an unlabeled section (search results) has no header to supply a top gap, so give it one.
			top += GRID_PADDING;
		}

		const rowCount = Math.ceil(section.count / PER_LINE);
		for (let r = 0; r < rowCount; r++) {
			const firstIndex = flat + r * PER_LINE;
			const count = Math.min(PER_LINE, section.count - r * PER_LINE);
			const rowIndex = rows.length;
			rows.push({ count, firstIndex, height: ROW_HEIGHT, key: `${section.key}:${r}`, top, type: 'emojis' });
			for (let c = 0; c < count; c++) {
				rowIndexForEmoji[firstIndex + c] = rowIndex;
			}
			top += ROW_HEIGHT;
		}
		if (rows.length > sectionStart) {
			sectionRowIndex.set(section.key, sectionStart);
		}
		flat += section.count;
	}

	return { rowIndexForEmoji, rows, sectionRowIndex, totalHeight: top };
}
