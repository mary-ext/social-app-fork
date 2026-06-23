import { style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';
import { OUTER_SPACE } from '#/components/PostLayout.const';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

// a single-image embed. the outer reserves the full content width and top gap; the real `AutoSizedImage`
// box model (sizer/abs from its own css) then sizes the tile: landscape fills the width, while a portrait
// sits left-aligned in a square footprint at `height × ratio`, narrower than the column.
export const single = style({
	marginTop: space.sm,
	width: '100%',
});

export const singleTile = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.md,
	height: '100%',
});

// the multi-image carousel: a fixed-height horizontal strip of tiles, clipped to the column like the real
// carousel. its height is set inline (shared with the tile-width math) and each tile's width comes from that
// height × the tile's clamped aspect. the negative right margin bleeds it past the content column to the
// frame's right edge, the way the real carousel breaks out of the post gutter.
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
