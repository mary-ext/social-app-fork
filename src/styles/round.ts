/**
 * Wraps a CSS length so it snaps to a whole CSS pixel — `round(length, 1px)`. Use for derived lengths (e.g.
 * line-height) that would otherwise resolve to fractional CSS pixels, whose edges land between device pixels
 * and snap inconsistently (a 1px divider can drop out).
 *
 * Lives in a plain module rather than a `*.css.ts` because vanilla-extract forbids function exports from
 * style files (it serializes their exports).
 *
 * @param length any CSS length expression
 * @returns the length wrapped in a `round()` to the nearest whole pixel
 */
export const roundToPx = (length: string) => `round(${length}, 1px)`;
