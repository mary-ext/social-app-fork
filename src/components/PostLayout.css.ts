import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

import { OUTER_SPACE, REPLY_LINE_WIDTH } from './PostLayout.const';

export const frame = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			position: 'relative',
			flexDirection: 'column',
			paddingInline: OUTER_SPACE,
		},
		variants: {
			hoverable: {
				true: {
					cursor: 'pointer',
					selectors: {
						'&:hover': {
							backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
						},
					},
				},
			},
			rootPad: { true: { paddingTop: space.lg } },
			topBorder: {
				true: {
					borderTopWidth: 1,
					borderTopStyle: 'solid',
					borderTopColor: colors.borderContrastLow,
				},
			},
		},
	},
	{ debugId: 'frame' },
);

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	gap: space.md,
});

export const avatarColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	alignItems: 'center',
});

export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	paddingBottom: space.md,
	minWidth: 0,
});

export const spine = style({
	flexGrow: 1,
	marginInline: 'auto',
	backgroundColor: colors.borderContrastLow,
	width: REPLY_LINE_WIDTH,
	selectors: {
		'.theme--dark &, .theme--dim &': {
			backgroundColor: colors.borderContrastMedium,
		},
	},
});
