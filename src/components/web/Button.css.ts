import { styleVariants } from '@vanilla-extract/css';

import { recipe } from '#/components/web/css/recipe';

import { vars } from '#/styles/contract.css';
import { components } from '#/styles/layers.css';
import { fontSize } from '#/styles/tokens.css';

const HOVER = '&:hover:not(:disabled)';

export const button = recipe(
	{
		base: {
			alignItems: 'center',
			appearance: 'none',
			border: 'none',
			borderRadius: '999px',
			color: 'inherit',
			cursor: 'pointer',
			display: 'inline-flex',
			fontFamily: 'inherit',
			fontWeight: 600,
			justifyContent: 'center',
			margin: 0,
			textDecoration: 'none',
			transitionDuration: '100ms',
			transitionProperty: 'background-color, color, border-color',
			transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
			whiteSpace: 'nowrap',
			selectors: {
				'&:disabled': { cursor: 'default', opacity: 0.5 },
				'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '2px' },
			},
		},
		compoundVariants: [
			{
				color: 'negative',
				style: {
					backgroundColor: vars.palette.negative_500,
					color: vars.palette.white,
					selectors: { [HOVER]: { backgroundColor: vars.palette.negative_600 } },
				},
				variant: 'solid',
			},
			{
				color: 'primary',
				style: {
					backgroundColor: vars.palette.primary_500,
					color: vars.palette.white,
					selectors: { [HOVER]: { backgroundColor: vars.palette.primary_600 } },
				},
				variant: 'solid',
			},
			{
				color: 'secondary',
				style: {
					backgroundColor: vars.palette.contrast_50,
					color: vars.palette.contrast_700,
					selectors: { [HOVER]: { backgroundColor: vars.palette.contrast_100 } },
				},
				variant: 'solid',
			},
			{
				color: 'negative',
				style: {
					backgroundColor: 'transparent',
					color: vars.palette.negative_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.negative_100 } },
				},
				variant: 'ghost',
			},
			{
				color: 'primary',
				style: {
					backgroundColor: 'transparent',
					color: vars.palette.primary_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.primary_100 } },
				},
				variant: 'ghost',
			},
			{
				color: 'secondary',
				style: {
					backgroundColor: 'transparent',
					color: vars.palette.contrast_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.contrast_50 } },
				},
				variant: 'ghost',
			},
			// emitted after the `size` variant, so the square hit target wins over its padding.
			{ shape: 'round', style: { height: '34px', padding: 0, width: '34px' } },
		],
		defaultVariants: { color: 'primary', shape: 'default', size: 'small', variant: 'solid' },
		variants: {
			color: { negative: {}, primary: {}, secondary: {} },
			shape: { default: {}, round: {} },
			size: {
				large: { fontSize: fontSize.md, gap: '6px', paddingBlock: '12px', paddingInline: '24px' },
				small: { fontSize: fontSize.sm, gap: '5px', paddingBlock: '8px', paddingInline: '14px' },
			},
			// `bare` inherits its surroundings (e.g. a full-row pressable); solid/ghost colors come from the
			// compound variants above.
			variant: { bare: { backgroundColor: 'transparent', color: 'inherit' }, ghost: {}, solid: {} },
		},
	},
	{ debugId: 'button', layer: components },
);

/** Per-instance font-size override for {@link ButtonText}, keyed by the {@link fontSize} scale. */
export const textSize = styleVariants(fontSize, (value) => ({
	'@layer': { [components]: { fontSize: value } },
}));
