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
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.md,
});

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
