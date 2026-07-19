import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

const desktop = '(width >= 800px)';

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: space._5xl,
	width: '100%',
	height: '100vh',
	paddingTop: 175,
	paddingBottom: 110,
	'@media': {
		[desktop]: {
			justifyContent: 'start',
		},
	},
});

export const textGroup = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: space.lg,
	width: '100%',
});

export const message = style({
	display: 'block',
	boxSizing: 'border-box',
	width: '100%',
	paddingInline: space.lg,
	'@media': {
		[desktop]: {
			width: 450,
			paddingInline: 0,
		},
	},
});

export const buttonGroup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	boxSizing: 'border-box',
	width: '100%',
	paddingInline: space.lg,
	'@media': {
		[desktop]: {
			width: 350,
			paddingInline: 0,
		},
	},
});
