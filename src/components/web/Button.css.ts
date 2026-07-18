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
			appearance: 'none',
			boxSizing: 'border-box',
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			transitionDuration: '100ms',
			transitionProperty: 'background-color, color, border-color',
			transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
			margin: 0,
			border: 'none',
			borderRadius: 999,
			textDecoration: 'none',
			lineHeight: roundToPx(`calc(${fontSizeScale} * ${lineHeight.snug})`),
			whiteSpace: 'nowrap',
			color: 'inherit',
			fontFamily: 'inherit',
			fontSize: fontSizeScale,
			fontWeight: fontWeight.medium,
			cursor: 'pointer',
			selectors: {
				'&:disabled': { opacity: 0.5, cursor: 'default' },
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
							opacity: 1,
							backgroundColor: vars.palette.negative_700,
							color: vars.palette.negative_300,
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
							opacity: 1,
							backgroundColor: vars.palette.primary_200,
							color: vars.palette.contrast_0,
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
						'&:disabled': { opacity: 1, color: vars.palette.contrast_300 },
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
							opacity: 1,
							backgroundColor: vars.palette.contrast_600,
							color: vars.palette.contrast_300,
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
						'&:disabled': { opacity: 1, color: vars.palette.negative_200 },
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
						'&:disabled': { opacity: 1, color: vars.palette.primary_200 },
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
					border: `1px solid ${vars.palette.negative_500}`,
					backgroundColor: vars.palette.contrast_0,
					color: vars.palette.negative_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.negative_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'negative_subtle',
				style: {
					border: `1px solid ${vars.palette.negative_500}`,
					backgroundColor: vars.palette.contrast_0,
					color: vars.palette.negative_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.negative_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'primary',
				style: {
					border: `1px solid ${vars.palette.primary_500}`,
					backgroundColor: vars.palette.contrast_0,
					color: vars.palette.primary_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.primary_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'primary_subtle',
				style: {
					border: `1px solid ${vars.palette.primary_500}`,
					backgroundColor: vars.palette.contrast_0,
					color: vars.palette.primary_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.primary_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'secondary',
				style: {
					border: `1px solid ${vars.palette.contrast_300}`,
					backgroundColor: vars.palette.contrast_0,
					color: vars.palette.contrast_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.contrast_50 } },
				},
				variant: 'outline',
			},
			{
				color: 'secondary_inverted',
				style: {
					border: `1px solid ${vars.palette.contrast_300}`,
					backgroundColor: vars.palette.contrast_0,
					color: vars.palette.contrast_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.contrast_50 } },
				},
				variant: 'outline',
			},
			{ shape: 'round', size: 'large', style: { padding: 0, width: 44, height: 44 } },
			{ shape: 'round', size: 'small', style: { padding: 0, width: 33, height: 33 } },
			{ shape: 'round', size: 'tiny', style: { padding: 0, width: 25, height: 25 } },
			{
				shape: 'rectangular',
				size: 'large',
				style: { gap: 3, borderRadius: 10, paddingBlock: 12, paddingInline: 25 },
			},
			{
				shape: 'rectangular',
				size: 'small',
				style: { gap: 3, borderRadius: 8, paddingBlock: 8, paddingInline: 13 },
			},
			{
				shape: 'rectangular',
				size: 'tiny',
				style: { gap: 2, borderRadius: 6, paddingBlock: 5, paddingInline: 9 },
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
				large: { vars: { [fontSizeVar]: fontSize.md }, gap: 6, paddingBlock: 12, paddingInline: 24 },
				small: { vars: { [fontSizeVar]: fontSize.md_sub }, gap: 5, paddingBlock: 8, paddingInline: 14 },
				tiny: { vars: { [fontSizeVar]: fontSize.xs }, gap: 3, paddingBlock: 5, paddingInline: 10 },
			},
			variant: {
				bare: { backgroundColor: 'transparent', color: 'inherit' },
				ghost: {},
				outline: {},
				// translucent dark treatment for buttons floating over media (banners, images)
				scrim: {
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					color: vars.palette.white,
					selectors: { [HOVER]: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } },
				},
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
				large: { width: 20, height: 20 },
				small: { width: 17, height: 17 },
				tiny: { width: 15, height: 15 },
			},
		},
	},
	{ debugId: 'buttonIcon', layer: components },
);
