import { style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const buttonWrap = style({
	display: 'flex',
	flexDirection: 'column',
	alignSelf: 'center',
	gap: space.md,
	marginTop: 24,
	width: '100%',
	maxWidth: 300,
});

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	minHeight: 0,
	alignItems: 'center',
	boxSizing: 'border-box',
	paddingBlock: space._5xl,
	paddingInline: space._2xl,
});

export const iconBox = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	alignSelf: 'center',
	justifyContent: 'center',
	width: 64,
	height: 64,
	borderRadius: borderRadius.full,
});

export const message = style({
	alignSelf: 'center',
	marginTop: 4,
	'@media': {
		'(min-width: 800px)': {
			maxWidth: '60%',
		},
	},
});

export const title = style({
	alignSelf: 'center',
	marginTop: 12,
});
