import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const notFoundRow = recipe({
	base: {
		alignItems: 'flex-start',
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'row',
		gap: space.lg,
		paddingBlock: space.md,
		paddingInline: space.lg,
	},
	variants: {
		topBorder: {
			true: {
				borderTopColor: colors.borderContrastLow,
				borderTopStyle: 'solid',
				borderTopWidth: 1,
			},
		},
	},
});

export const deletedAvatar = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_50,
	borderRadius: '50%',
	display: 'flex',
	flexShrink: 0,
	height: 36,
	justifyContent: 'center',
	width: 36,
});

export const deletedMessage = style({
	fontStyle: 'italic',
});

export const empty = style({
	paddingTop: 28,
});

export const footerNoBorder = style({
	borderTopWidth: 0,
});
