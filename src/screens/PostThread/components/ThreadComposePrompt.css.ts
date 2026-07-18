import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const outer = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			position: 'relative',
			flexDirection: 'column',
			paddingRight: space.sm,
			paddingLeft: space.sm,
		},
		variants: {
			isDesktop: {
				true: {
					borderTopWidth: 1,
					borderTopStyle: 'solid',
					borderTopColor: colors.borderContrastLow,
					backgroundColor: colors.bg,
					paddingTop: space.xs,
					paddingBottom: space.xs,
				},
				false: {
					paddingBottom: space._2xs,
				},
			},
		},
		defaultVariants: {
			isDesktop: false,
		},
	},
	{ debugId: 'outer' },
);

export const gradient = style({
	position: 'absolute',
	inset: 0,
	zIndex: -1,
	backgroundImage: `linear-gradient(to bottom, ${colorMix(colors.bg, '0%')} 15%, ${colors.bg} 40%)`,
	pointerEvents: 'none',
});

export const button = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			alignItems: 'center',
			transition: 'background-color 0.15s ease',
			border: 'none',
			borderRadius: 9999,
			padding: space.sm,
			width: '100%',
			cursor: 'pointer',
		},
		variants: {
			isDesktop: {
				true: {
					backgroundColor: 'transparent',
					selectors: {
						'&:hover': {
							backgroundColor: colors.contrast_25,
						},
						'&:focus-visible': {
							outline: `2px solid ${colors.primary_500}`,
							outlineOffset: -2,
							backgroundColor: colors.contrast_25,
						},
					},
				},
				false: {
					backgroundColor: colors.contrast_25,
					selectors: {
						'&:focus-visible': {
							outline: `2px solid ${colors.primary_500}`,
							outlineOffset: -2,
						},
					},
				},
			},
		},
		defaultVariants: {
			isDesktop: false,
		},
	},
	{ debugId: 'button' },
);
