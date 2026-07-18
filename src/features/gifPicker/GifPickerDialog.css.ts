import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const header = style({
	flexShrink: 0,
	backgroundColor: vars.palette.contrast_0,
	paddingTop: space.xl,
	paddingInline: space.xl,
	'@media': {
		'(min-width: 800px)': {
			paddingTop: space._2xl,
			paddingInline: space._2xl,
		},
	},
});

export const placeholder = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	paddingInline: space.xl,
	minHeight: 0,
	'@media': {
		'(min-width: 800px)': {
			paddingInline: space._2xl,
		},
	},
});
