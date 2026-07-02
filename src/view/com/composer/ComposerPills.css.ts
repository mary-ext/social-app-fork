import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const pills = style({
	backgroundColor: vars.palette.contrast_0,
	display: 'flex',
	flexDirection: 'row',
	overflowX: 'auto',
	gap: space.sm,
	padding: space.sm,

	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});
