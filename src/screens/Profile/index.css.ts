import { style } from '@vanilla-extract/css';

import { LEAD_IN } from '#/components/web/Layout/scroll-away';
import { scope } from '#/components/web/Layout/ScrollAway.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
	overflowAnchor: 'none',
});

export const scrollAway = style([
	scope,
	{
		vars: { [LEAD_IN]: '0.5' },
	},
]);
