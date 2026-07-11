import { createVar, fallbackVar, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

const HOVER = '&:hover:not(:disabled)';

const fontSizeVar = createVar();
const fontSizeScale = fallbackVar(fontSizeVar, fontSize.md_sub);

export const button = recipe(
	{
		base: {
			alignItems: 'center',
			appearance: 'none',
			border: 'none',
			borderRadius: 999,
			boxSizing: 'border-box',
			color: 'inherit',
			cursor: 'pointer',
			display: 'inline-flex',
			fontFamily: 'inherit',
			fontSize: fontSizeScale,
			fontWeight: fontWeight.medium,
			justifyContent: 'center',
			lineHeight: roundToPx(`calc(${fontSizeScale} * ${lineHeight.snug})`),
			margin: 0,
			textDecoration: 'none',
			transitionDuration: '100ms',
			transitionProperty: 'background-color, color, border-color',
			transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
			whiteSpace: 'nowrap',
			selectors: {
				'&:disabled': { cursor: 'default', opacity: 0.5 },
				'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			},
		},
		compoundVariants: [
			{
				color: 'negative',
				style: {
					backgroundColor: vars.palette.negative_500,
					color: vars.palette.white,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.negative_600 },
						'&:disabled': {
							backgroundColor: vars.palette.negative_700,
							color: vars.palette.negative_300,
							opacity: 1,
						},
					},
				},
				variant: 'solid',
			},
			{
				color: 'primary',
				style: {
					backgroundColor: vars.palette.primary_500,
					color: vars.palette.white,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.primary_600 },
						'&:disabled': {
							backgroundColor: vars.palette.primary_200,
							color: vars.palette.contrast_0,
							opacity: 1,
						},
					},
				},
				variant: 'solid',
			},
			{
				color: 'secondary',
				style: {
					backgroundColor: vars.palette.contrast_50,
					color: vars.palette.contrast_700,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.contrast_100 },
						'&:disabled': { color: vars.palette.contrast_300, opacity: 1 },
					},
				},
				variant: 'solid',
			},
			{
				color: 'secondary_inverted',
				style: {
					backgroundColor: vars.palette.contrast_900,
					color: vars.palette.contrast_0,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.contrast_975 },
						'&:disabled': {
							backgroundColor: vars.palette.contrast_600,
							color: vars.palette.contrast_300,
							opacity: 1,
						},
					},
				},
				variant: 'solid',
			},
			{
				color: 'negative_subtle',
				style: {
					backgroundColor: vars.palette.negative_50,
					color: vars.palette.negative_600,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.negative_100 },
						'&:disabled': { color: vars.palette.negative_200, opacity: 1 },
					},
				},
				variant: 'solid',
			},
			{
				color: 'primary_subtle',
				style: {
					backgroundColor: vars.palette.primary_50,
					color: vars.palette.primary_600,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.primary_100 },
						'&:disabled': { color: vars.palette.primary_200, opacity: 1 },
					},
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
			{
				color: 'negative',
				style: {
					backgroundColor: vars.palette.contrast_0,
					border: `1px solid ${vars.palette.negative_500}`,
					color: vars.palette.negative_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.negative_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'negative_subtle',
				style: {
					backgroundColor: vars.palette.contrast_0,
					border: `1px solid ${vars.palette.negative_500}`,
					color: vars.palette.negative_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.negative_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'primary',
				style: {
					backgroundColor: vars.palette.contrast_0,
					border: `1px solid ${vars.palette.primary_500}`,
					color: vars.palette.primary_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.primary_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'primary_subtle',
				style: {
					backgroundColor: vars.palette.contrast_0,
					border: `1px solid ${vars.palette.primary_500}`,
					color: vars.palette.primary_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.primary_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'secondary',
				style: {
					backgroundColor: vars.palette.contrast_0,
					border: `1px solid ${vars.palette.contrast_300}`,
					color: vars.palette.contrast_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.contrast_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'secondary_inverted',
				style: {
					backgroundColor: vars.palette.contrast_0,
					border: `1px solid ${vars.palette.contrast_300}`,
					color: vars.palette.contrast_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.contrast_50 } },
				},
				variant: 'outline',
			},
			{ shape: 'round', size: 'large', style: { height: 44, padding: 0, width: 44 } },
			{ shape: 'round', size: 'small', style: { height: 33, padding: 0, width: 33 } },
			{ shape: 'round', size: 'tiny', style: { height: 25, padding: 0, width: 25 } },
			{
				shape: 'rectangular',
				size: 'large',
				style: { borderRadius: 10, gap: 3, paddingBlock: 12, paddingInline: 25 },
			},
			{
				shape: 'rectangular',
				size: 'small',
				style: { borderRadius: 8, gap: 3, paddingBlock: 8, paddingInline: 13 },
			},
			{
				shape: 'rectangular',
				size: 'tiny',
				style: { borderRadius: 6, gap: 2, paddingBlock: 5, paddingInline: 9 },
			},
		],
		defaultVariants: { color: 'primary', shape: 'default', size: 'small', variant: 'solid' },
		variants: {
			color: {
				negative: {},
				negative_subtle: {},
				primary: {},
				primary_subtle: {},
				secondary: {},
				secondary_inverted: {},
			},
			shape: { default: {}, rectangular: {}, round: {} },
			size: {
				large: { gap: 6, paddingBlock: 12, paddingInline: 24, vars: { [fontSizeVar]: fontSize.md } },
				small: { gap: 5, paddingBlock: 8, paddingInline: 14, vars: { [fontSizeVar]: fontSize.md_sub } },
				tiny: { gap: 3, paddingBlock: 5, paddingInline: 10, vars: { [fontSizeVar]: fontSize.xs } },
			},
			variant: {
				bare: { backgroundColor: 'transparent', color: 'inherit' },
				ghost: {},
				outline: {},
				solid: {},
			},
		},
	},
	{ debugId: 'button', layer: components },
);

export const textSize = styleVariants(fontSize, (value) => ({
	'@layer': { [components]: { fontSize: value } },
}));

export const iconBox = recipe(
	{
		base: {
			display: 'inline-grid',
			placeContent: 'center',
		},
		compoundVariants: [
			{ narrow: true, size: 'large', style: { width: 10 } },
			{ narrow: true, size: 'small', style: { width: 10 } },
		],
		variants: {
			narrow: { false: {}, true: {} },
			pull: { false: {}, true: { marginInline: -2 } },
			size: {
				large: { height: 20, width: 20 },
				small: { height: 17, width: 17 },
				tiny: { height: 15, width: 15 },
			},
		},
	},
	{ debugId: 'buttonIcon', layer: components },
);
