import { space } from '#/styles/tokens.css';

export const AVATAR_SIZE = 36;

/** avatar size for add-post and draft reply rows. */
export const GHOST_AVATAR_SIZE = 20;

/** width of the post gutter holding the avatar and thread line. */
export const RAIL_WIDTH = space.lg + AVATAR_SIZE + space.md;

export const RIGHT_PADDING = space.lg;

/** half the inter-post gap, supplied by the footer's bottom padding. */
export const POST_GAP_CENTER = space.lg / 2;

/** opacity of the drag source. */
export const DRAGGING_OPACITY = 0.4;
