// per-index final-line widths for the thread reply skeletons. these render per item without a freezing memo,
// so a deterministic pick keeps each row stable across re-renders where a `Math.random` would reshuffle and
// flicker. the order is the per-index sequence, not sorted.
const LAST_LINE_WIDTHS = [55, 70, 45, 85, 60];

/**
 * The frozen text-paragraph shape a thread reply skeleton at {@link index} renders.
 *
 * @param index the reply's position in the thread list.
 * @returns the line count and the final, partial line's width (as a percentage).
 */
export const threadTextShape = (index: number): { lastWidth: number; lineCount: number } => ({
	lastWidth: LAST_LINE_WIDTHS[index % LAST_LINE_WIDTHS.length] ?? 60,
	lineCount: 1 + (index % 3),
});
