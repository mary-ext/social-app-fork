import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
	paddingBottom: space.md,
});

export const back = style({
	flexShrink: 0,
	marginLeft: -space.sm,
	'@media': {
		'(width >= 800px)': {
			display: 'none',
		},
	},
});
