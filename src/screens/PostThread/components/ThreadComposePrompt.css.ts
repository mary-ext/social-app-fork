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
			paddingRight: space.sm,
			paddingLeft: space.sm,
		},
		defaultVariants: {
			isDesktop: false,
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
					backgroundImage: `linear-gradient(to bottom, transparent, ${colorMix(colors.bg, '80%')} 80%, ${colors.bg})`,
					paddingBottom: `calc(${space.sm}px + env(safe-area-inset-bottom, 0px))`,
				},
			},
		},
	},
	{ debugId: 'outer' },
);

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
		defaultVariants: {
			isDesktop: false,
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
	},
	{ debugId: 'button' },
);
