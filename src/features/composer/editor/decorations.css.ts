import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import { POST_GAP_CENTER } from '../shared/layout';

export const facet = style({
	color: vars.text.link,
});

export const overflow = style({
	backgroundColor: `color-mix(in srgb, ${vars.palette.negative_500} 20%, transparent)`,
});

const slot = style({
	display: 'block',
	whiteSpace: 'normal',
	userSelect: 'none',
});

export const headerSlot = slot;

// drop markers align with the center of this gap.
export const footerSlot = style([slot, { paddingBottom: POST_GAP_CENTER * 2 }]);
