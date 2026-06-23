import { style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';
import { OUTER_SPACE } from '#/components/PostLayout.const';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

/** Top gap between the post text and a single-image embed, spanning the full content width. */
export const single = style({
	marginTop: space.sm,
	width: '100%',
});

/** Constrained single-image tile (reply/feed surfaces): fills the `AutoSizedImage` sizer/abs box. */
export const constrainedTile = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.md,
	height: '100%',
});

/** Uncropped single-image tile (anchor surface): one full-width box owning its (1:4-clamped) aspect ratio. */
export const bleedTile = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.md,
	width: '100%',
});

/**
 * The carousel strip. Its first tile sits at the content-column left (like the live carousel at rest, whose
 * leftward shift is only hidden scroll overflow), so it bleeds the right gutter only — same on every
 * surface.
 */
export const carousel = style({
	display: 'flex',
	flexDirection: 'row',
	gap: ITEM_GAP,
	marginRight: OUTER_SPACE * -1,
	marginTop: space.sm,
	overflow: 'hidden',
});

export const carouselTile = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.md,
	flexShrink: 0,
	height: '100%',
});
