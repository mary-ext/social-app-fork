import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { MOUSE, PRESSING } from '#/styles/interaction';
import { space } from '#/styles/tokens.css';

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
	border: 'none',
	background: 'none',
	paddingBlock: space.md,
	paddingInline: space.lg,
	width: '100%',
	textAlign: 'left',
	color: 'inherit',
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		[`${MOUSE} &:hover, &:focus-visible, ${PRESSING}`]: {
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
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	width: '100%',
	minWidth: 0,
});

export const name = style({
	flexShrink: 1,
	minWidth: 0,
});

export const timestamp = style({
	flexShrink: 0,
});
