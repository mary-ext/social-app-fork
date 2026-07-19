import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const button = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	gap: space.md,
	alignItems: 'center',
	outline: 'none',
	border: 'none',
	background: 'none',
	padding: 0,
	textAlign: 'start',
	cursor: 'pointer',

	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
		},
	},
});

export const iconBox = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	width: 36,
	height: 36,
});

export const textColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const italic = style({
	fontStyle: 'italic',
});

export const profileRow = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	width: '100%',
});

export const labelSpaced = style({
	marginTop: space.md,
});

export const notice = style({
	display: 'block',
	width: '100%',
	fontStyle: 'italic',
});
