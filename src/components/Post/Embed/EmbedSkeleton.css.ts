import { style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';
import { OUTER_SPACE } from '#/components/PostLayout.const';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const single = style({
	marginTop: space.sm,
	width: '100%',
});

export const singleTile = style({
	borderRadius: borderRadius.md,
	backgroundColor: vars.palette.contrast_50,
});

export const carousel = style({
	display: 'flex',
	flexDirection: 'row',
	gap: ITEM_GAP,
	marginTop: space.sm,
	marginRight: OUTER_SPACE * -1,
	overflow: 'hidden',
});

export const carouselTile = style({
	flexShrink: 0,
	borderRadius: borderRadius.md,
	backgroundColor: vars.palette.contrast_50,
	height: '100%',
});
