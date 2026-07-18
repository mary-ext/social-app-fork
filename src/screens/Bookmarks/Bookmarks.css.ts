import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const notFoundRow = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			gap: space.lg,
			alignItems: 'flex-start',
			paddingBlock: space.md,
			paddingInline: space.lg,
		},
		variants: {
			topBorder: {
				true: {
					borderTopWidth: 1,
					borderTopStyle: 'solid',
					borderTopColor: colors.borderContrastLow,
				},
			},
		},
	},
	{ debugId: 'notFoundRow' },
);

export const deletedAvatar = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: '50%',
	backgroundColor: colors.contrast_50,
	width: 36,
	height: 36,
});

export const deletedMessage = style({
	fontStyle: 'italic',
});

export const empty = style({
	paddingTop: 28,
});
