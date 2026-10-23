export type Size = { h: number; w: number };

/**
 * groups items into the lines a wrapping row would place them on. unmeasured items are skipped.
 *
 * @param order item keys in display order
 * @param sizes each item's measured size
 * @param options the row's width and the gap between items
 * @returns item keys per line, top to bottom
 */
export const wrapLines = (
	order: string[],
	sizes: Record<string, Size>,
	{ gap, rowWidth }: { gap: number; rowWidth: number },
): string[][] => {
	const lines: string[][] = [];
	let x = 0;
	for (const key of order) {
		const size = sizes[key];
		if (!size) {
			continue;
		}
		if (lines.length === 0 || (x > 0 && x + size.w > rowWidth + 0.5)) {
			lines.push([]);
			x = 0;
		}
		lines.at(-1)!.push(key);
		x += size.w + gap;
	}
	return lines;
};
