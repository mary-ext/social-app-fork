import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const row = style({
	alignItems: 'center',
	background: 'none',
	border: 'none',
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	font: 'inherit',
	gap: space.md,
	paddingBlock: space.md,
	paddingInline: space.lg,
	textAlign: 'left',
	width: '100%',
	selectors: {
		'&:hover, &:active, &:focus-visible': {
			backgroundColor: colors.contrast_25,
		},
	},
});

export const body = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	minWidth: 0,
	width: '100%',
});

export const name = style({
	flexShrink: 1,
	minWidth: 0,
});

export const timestamp = style({
	flexShrink: 0,
});
