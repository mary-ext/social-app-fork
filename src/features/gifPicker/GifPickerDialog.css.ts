import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const header = style({
	backgroundColor: vars.palette.contrast_0,
	flexShrink: 0,
	paddingInline: space.xl,
	paddingTop: space.xl,
	'@media': {
		'(min-width: 800px)': {
			paddingInline: space._2xl,
			paddingTop: space._2xl,
		},
	},
});

export const placeholder = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minHeight: 0,
	paddingInline: space.xl,
	'@media': {
		'(min-width: 800px)': {
			paddingInline: space._2xl,
		},
	},
});
