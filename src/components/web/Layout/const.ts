// the web layout owns its own copy of these constants, independent of `#/components/Layout/const`.

/** Visually aligns header icon buttons with the content below them. */
export const BUTTON_VISUAL_ALIGNMENT_OFFSET = 3;

/** How far to shift the center column at the tablet breakpoint. */
export const CENTER_COLUMN_OFFSET = -105;

/** Width of the center column. */
export const CENTER_COLUMN_WIDTH = 600;

/** Width of a small square or round header button. */
export const HEADER_SLOT_SIZE = 33;

/** Horizontal shift that compensates for the scrollbar gutter removed by dialogs. */
export const SCROLLBAR_OFFSET = 'calc(-1 * var(--removed-body-scroll-bar-size, 0px) / 2)';
