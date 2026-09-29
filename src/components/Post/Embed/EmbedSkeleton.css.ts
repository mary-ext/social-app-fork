import { style } from '@vanilla-extract/css';

import * as strip from '#/components/ImageEmbed/carousel/strip.css';
import { bleedStrip, insetRightVar } from '#/components/images/Gallery/index.css';
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

export const carousel = style([strip.root, { marginTop: space.sm }]);

// match the loaded carousel's right gutter without measuring the skeleton.
export const carouselRow = style([
	strip.row,
	bleedStrip,
	{
		vars: { [insetRightVar]: `${OUTER_SPACE}px` },
		overflow: 'hidden',
	},
]);

export const carouselTile = style([
	strip.tile,
	{
		borderRadius: borderRadius.md,
		backgroundColor: vars.palette.contrast_50,
	},
]);
