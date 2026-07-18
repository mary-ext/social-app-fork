import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const button = style({
	transition: 'background-color 0.15s ease',
	borderBottom: 0,
	borderInline: 0,
	backgroundColor: 'transparent',
	paddingTop: space.lg,
	paddingBottom: space.lg,
	width: '100%',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
		},
	},
});

export const row = style({
	alignItems: 'center',
});

export const avatarColumn = style({
	width: LINEAR_AVI_WIDTH,
});

export const contentColumn = style({
	paddingBottom: 0,
});

export const iconCircle = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 13,
	backgroundColor: colors.contrast_25,
	width: 26,
	height: 26,
	color: colors.textContrastMedium,
});

export const label = style({
	flex: 1,
	textAlign: 'left',
});
