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
			flexDirection: 'column',
			paddingLeft: space.sm,
			paddingRight: space.sm,
			position: 'relative',
		},
		variants: {
			isDesktop: {
				true: {
					backgroundColor: colors.bg,
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
					paddingBottom: space.xs,
					paddingTop: space.xs,
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
	backgroundImage: `linear-gradient(to bottom, ${colorMix(colors.bg, '0%')} 15%, ${colors.bg} 40%)`,
	inset: 0,
	pointerEvents: 'none',
	position: 'absolute',
	zIndex: -1,
});

export const button = recipe(
	{
		base: {
			alignItems: 'center',
			border: 'none',
			borderRadius: 9999,
			cursor: 'pointer',
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			padding: space.sm,
			transition: 'background-color 0.15s ease',
			width: '100%',
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
							backgroundColor: colors.contrast_25,
							outline: `2px solid ${colors.primary_500}`,
							outlineOffset: -2,
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
