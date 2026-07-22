import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const button = recipe(
	{
		base: {
			appearance: 'none',
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-start',
			width: '100%',
			padding: space.lg,
			gap: space.md,
			border: 'none',
			background: 'transparent',
			textAlign: 'left',
			cursor: 'pointer',
			':hover': {
				backgroundColor: colors.contrast_25,
			},
		},
		variants: {
			borderTop: {
				true: {
					borderTop: `1px solid ${colors.borderContrastLow}`,
				},
			},
		},
	},
	{ debugId: 'button' },
);

export const iconBox = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 36,
	height: 36,
	marginRight: space.md,
	flexShrink: 0,
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
});

export const textContent = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minWidth: 0,
});

export const titleText = style({
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	fontStyle: 'italic',
});

export const profileRow = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	width: '100%',
});

export const italic = style({
	fontStyle: 'italic',
});

export const labelSpaced = style({
	marginTop: space.md,
});

export const notice = style({
	display: 'block',
	width: '100%',
	fontStyle: 'italic',
});
