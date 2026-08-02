import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { iconSize, space } from '#/styles/tokens.css';

export const list = style({
	minHeight: 500,
	overflowY: 'auto',
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_50 },
		'.theme--dark &': { backgroundColor: vars.palette.contrast_0 },
		'.theme--dim &': { backgroundColor: '#000000' },
	},
});

export const itemWrap = style({
	paddingTop: space.sm,
	paddingInline: space.sm,
	'@media': {
		'(min-width: 500px)': {
			paddingTop: space.md,
			paddingInline: space.md,
		},
	},
});

export const loading = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space.xl,
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'center',
	paddingInline: space.xl,
	minHeight: 500,
});

export const footerNote = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._2xl,
});

export const pageXIcon = style({
	width: iconSize._4xl,
	height: iconSize._4xl,
	color: colors.textContrastLow,
});
