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
			flexDirection: 'column',
			paddingInline: OUTER_SPACE,
			position: 'relative',
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
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
				},
			},
		},
	},
	{ debugId: 'frame' },
);

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	position: 'relative',
});

export const avatarColumn = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
});

export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	paddingBottom: space.md,
});

export const spine = style({
	backgroundColor: colors.borderContrastLow,
	flexGrow: 1,
	marginInline: 'auto',
	width: REPLY_LINE_WIDTH,
	selectors: {
		'.theme--dark &, .theme--dim &': {
			backgroundColor: colors.borderContrastMedium,
		},
	},
});
