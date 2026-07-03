/**
 * wraps a CSS length so it snaps to a whole CSS pixel.
 *
 * @param length css length expression
 * @returns length wrapped in a `round()` to the nearest whole pixel
 */
export const roundToPx = (length: string) => `round(${length}, 1px)`;
