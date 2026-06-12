import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingBottom: space.lg,
});

export const title = style({
	paddingRight: space._4xl,
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBottom: space.xl,
});

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
});

export const admonitionSpacing = style({
	marginTop: space.xs,
});

export const nameColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const cardRow = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	'@media': {
		'(min-width: 800px)': {
			flexDirection: 'row-reverse',
			justifyContent: 'flex-start',
		},
	},
});
