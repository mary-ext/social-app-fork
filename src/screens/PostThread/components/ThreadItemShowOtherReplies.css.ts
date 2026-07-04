import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const button = style({
	backgroundColor: 'transparent',
	borderInline: 0,
	borderBottom: 0,
	paddingBottom: space.lg,
	paddingTop: space.lg,
	transition: 'background-color 0.15s ease',
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
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: 13,
	// the icon inherits this via `fill="currentColor"`
	color: colors.textContrastMedium,
	display: 'flex',
	height: 26,
	justifyContent: 'center',
	width: 26,
});

export const label = style({
	flex: 1,
	// the RNW Button centers its content; keep the row's label text left-aligned.
	textAlign: 'left',
});
