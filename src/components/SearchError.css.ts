import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const outer = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space._4xl,
	paddingInline: space.xl,
	paddingBlock: 150,
});

export const body = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	maxWidth: 294,
	'@media': {
		'(width >= 800px)': {
			gap: space.md,
			maxWidth: 394,
		},
	},
});
