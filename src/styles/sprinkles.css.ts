import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles';

import { vars } from '#/styles/contract.css';
import { borderRadius, fontSize, fontWeight, lineHeight, space } from '#/styles/tokens';

const px = <T extends Record<string, number>>(scale: T): { [K in keyof T]: string } => {
	const out = {} as { -readonly [K in keyof T]: string };
	for (const k of Object.keys(scale) as (keyof T)[]) {
		out[k] = `${scale[k]}px`;
	}
	return out;
};

// font sizes scale via a `--font-scale` custom property on <html> (default 1), so user font-size
// preferences flow through without per-component JS. see `#/styles` wiring in the ALF font context.
const scaledFontSize = (() => {
	const out = {} as { -readonly [K in keyof typeof fontSize]: string };
	for (const k of Object.keys(fontSize) as (keyof typeof fontSize)[]) {
		out[k] = `calc(var(--font-scale, 1) * ${fontSize[k]}px)`;
	}
	return out;
})();

const spacing = { none: '0px', ...px(space) };
const spacingAuto = { ...spacing, auto: 'auto' };
const borderWidths = { 0: '0px', 1: '1px', 2: '2px' };

/**
 * Color values for `color` / `background` / `borderColor`. Exposes the full themed palette plus the semantic
 * aliases mirroring `ThemeAtoms` (`text`, `bg`, `border*`). All resolve to themed CSS vars, so they invert
 * with the active theme.
 */
const colors = {
	...vars.palette,
	bg: vars.palette.contrast_0,
	borderContrastHigh: vars.palette.contrast_300,
	borderContrastLow: vars.palette.contrast_100,
	borderContrastMedium: vars.palette.contrast_200,
	text: vars.palette.contrast_1000,
	textContrastHigh: vars.palette.contrast_900,
	textContrastLow: vars.palette.contrast_400,
	textContrastMedium: vars.palette.contrast_700,
	textInverted: vars.palette.contrast_0,
	transparent: 'transparent',
};

const responsive = defineProperties({
	conditions: {
		gtMobile: { '@media': 'screen and (min-width: 800px)' },
		gtPhone: { '@media': 'screen and (min-width: 500px)' },
		gtTablet: { '@media': 'screen and (min-width: 1300px)' },
		mobile: {},
	},
	defaultCondition: 'mobile',
	responsiveArray: ['mobile', 'gtPhone', 'gtMobile', 'gtTablet'],
	properties: {
		alignItems: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
		borderRadius: { ...px(borderRadius), none: '0px' },
		borderStyle: ['solid', 'none'],
		borderWidth: borderWidths,
		display: ['none', 'block', 'flex', 'inline', 'inline-flex', 'grid'],
		flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
		flexGrow: [0, 1],
		flexShrink: [0, 1],
		flexWrap: ['nowrap', 'wrap'],
		fontSize: scaledFontSize,
		fontWeight,
		gap: spacing,
		height: { auto: 'auto', full: '100%' },
		justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'],
		lineHeight,
		marginBottom: spacingAuto,
		marginLeft: spacingAuto,
		marginRight: spacingAuto,
		marginTop: spacingAuto,
		maxWidth: { 400: '400px', 600: '600px', full: '100%', none: 'none' },
		overflow: ['visible', 'hidden', 'auto', 'scroll', 'clip'],
		paddingBottom: spacing,
		paddingLeft: spacing,
		paddingRight: spacing,
		paddingTop: spacing,
		position: ['relative', 'absolute', 'fixed', 'sticky'],
		textAlign: ['left', 'center', 'right'],
		width: { auto: 'auto', fit: 'fit-content', full: '100%' },
	},
	shorthands: {
		margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
		marginX: ['marginLeft', 'marginRight'],
		marginY: ['marginTop', 'marginBottom'],
		padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
		paddingX: ['paddingLeft', 'paddingRight'],
		paddingY: ['paddingTop', 'paddingBottom'],
	},
});

const colorProperties = defineProperties({
	properties: {
		background: colors,
		borderColor: colors,
		color: colors,
		fill: colors,
	},
});

export const sprinkles = createSprinkles(colorProperties, responsive);
export type Sprinkles = Parameters<typeof sprinkles>[0];
