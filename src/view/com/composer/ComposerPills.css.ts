import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const pills = style({
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: space.sm,
	backgroundColor: vars.palette.contrast_0,
	padding: space.sm,
	overflowX: 'auto',

	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});
