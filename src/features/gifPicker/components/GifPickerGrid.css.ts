import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const scroll = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
});

// responsive horizontal padding matches the header; bottom padding gives the last row breathing room.
export const content = style({
	boxSizing: 'border-box',
	paddingBottom: space.xl,
	paddingInline: space.xl,
	'@media': {
		'(min-width: 800px)': {
			paddingInline: space._2xl,
		},
	},
});

export const columns = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const column = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.sm,
	minWidth: 0,
});

export const footer = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: space.xl,
});
