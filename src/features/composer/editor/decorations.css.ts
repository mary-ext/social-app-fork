import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const facet = style({
	color: vars.text.link,
});

export const overflow = style({
	backgroundColor: `color-mix(in srgb, ${vars.palette.negative_500} 20%, transparent)`,
});
