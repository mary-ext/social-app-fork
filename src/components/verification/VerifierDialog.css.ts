import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
});

export const imageBox = style({
	background: colors.contrast_25,
	borderRadius: borderRadius.md,
	minHeight: 100,
	overflow: 'hidden',
	width: '100%',
});

export const image = style({
	aspectRatio: '353 / 160',
	display: 'block',
	width: '100%',
});

export const textBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const title = style({
	paddingRight: space._4xl,
});

export const inlineCheck = style({
	display: 'inline-flex',
	position: 'relative',
	top: -3,
	verticalAlign: 'middle',
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	'@media': {
		'(min-width: 800px)': {
			flexDirection: 'row',
			justifyContent: 'flex-end',
		},
	},
});
