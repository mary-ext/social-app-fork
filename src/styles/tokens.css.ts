import { createGlobalTheme, createVar, fallbackVar } from '@vanilla-extract/css';

export const space = {
	_2xs: 2,
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	_2xl: 24,
	_3xl: 28,
	_4xl: 32,
	_5xl: 40,
} as const;

export const lineHeight = {
	none: 1,
	snug: 1.3,
	tight: 1.15,
} as const;

export const borderRadius = {
	_2xs: 2,
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	full: 999,
} as const;

export const fontWeight = {
	normal: '400',
	medium: '500',
	semiBold: '600',
	bold: '700',
} as const;

export const systemFontFamily = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;
export const themeFontFamily = `"Inter Variable", ${systemFontFamily}`;

export const fontFamilyVar = createVar();

export const fontFamily = fallbackVar(fontFamilyVar, themeFontFamily);

export const zIndex = {
	base: 0,
	raised: 10,
	float: 20,
	modal: 100,
	popover: 110,
	tooltip: 120,
	toast: 130,
} as const;

export const fontScale = createVar();

const type = {
	_2xs: { fontSize: 0.625, lineHeight: 1 },
	xs: { fontSize: 0.6875, lineHeight: 1 },
	sm: { fontSize: 0.75, lineHeight: 1 },
	md_sub: { fontSize: 0.8125, lineHeight: 1.25 },
	md: { fontSize: 0.875, lineHeight: 1.25 },
	lg_sub: { fontSize: 0.9375, lineHeight: 1.5 },
	lg: { fontSize: 1, lineHeight: 1.5 },
	xl: { fontSize: 1.125, lineHeight: 1.75 },
	_2xl: { fontSize: 1.25, lineHeight: 1.75 },
	_3xl: { fontSize: 1.5, lineHeight: 2 },
	_4xl: { fontSize: 1.875, lineHeight: 2.25 },
	_5xl: { fontSize: 2.375, lineHeight: 2.5 },
} as const;

const scaled = (rem: number) => `calc(${rem}rem * ${fallbackVar(fontScale, '1')})`;

export const fontSize = createGlobalTheme(
	':root',
	Object.fromEntries(Object.entries(type).map(([key, { fontSize: size }]) => [key, scaled(size)])) as {
		[K in keyof typeof type]: string;
	},
);

export const fontLeading = Object.fromEntries(
	Object.entries(type).map(([key, { fontSize: size, lineHeight: leading }]) => [key, leading / size]),
) as { [K in keyof typeof type]: number };
