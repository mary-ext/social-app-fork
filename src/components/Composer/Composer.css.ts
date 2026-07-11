import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize } from '#/styles/tokens.css';

const fontSizeVar = createVar();
const leadingVar = createVar();

export const paddingTopVar = createVar();
export const paddingBottomVar = createVar();
export const paddingLeftVar = createVar();
export const paddingRightVar = createVar();
export const minRowsVar = createVar();
export const maxRowsVar = createVar();

const fontSizeValue = fallbackVar(fontSizeVar, fontSize.lg);
const leadingValue = fallbackVar(leadingVar, String(fontLeading.lg));

const lineHeightValue = roundToPx(`calc(${fontSizeValue} * ${leadingValue})`);

const rowsHeight = (rows: string) =>
	`calc(${lineHeightValue} * ${rows} + ${paddingTopVar} + ${paddingBottomVar})`;

const textMetrics = style({
	fontFamily: 'inherit',
	fontSize: fontSizeValue,
	letterSpacing: 'normal',
	lineHeight: lineHeightValue,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
});

const padding = style({
	paddingBottom: paddingBottomVar,
	paddingLeft: paddingLeftVar,
	paddingRight: paddingRightVar,
	paddingTop: paddingTopVar,
});

export const root = recipe(
	{
		base: {
			position: 'relative',
			zIndex: 0,
		},
		variants: {
			fontSize: {
				lg: { vars: { [fontSizeVar]: fontSize.lg, [leadingVar]: String(fontLeading.lg) } },
				md: { vars: { [fontSizeVar]: fontSize.md, [leadingVar]: String(fontLeading.md) } },
			},
		},
		defaultVariants: {
			fontSize: 'lg',
		},
	},
	{ debugId: 'root' },
);

export const capped = style({
	maxHeight: rowsHeight(maxRowsVar),
	overflowY: 'auto',
	scrollPaddingBottom: paddingBottomVar,
	scrollPaddingTop: paddingTopVar,
	scrollbarColor: `${vars.palette.contrast_200} transparent`,
	scrollbarWidth: 'thin',
});

export const overlay = style([
	textMetrics,
	padding,
	{
		color: vars.palette.contrast_1000,
		left: 0,
		pointerEvents: 'none',
		position: 'absolute',
		right: 0,
		top: 0,
		zIndex: 10,
	},
]);

export const facet = style({
	color: vars.palette.primary_500,
});

export const textarea = style([
	textMetrics,
	padding,
	{
		appearance: 'none',
		background: 'transparent',
		border: 0,
		boxSizing: 'border-box',
		caretColor: vars.palette.contrast_1000,
		color: 'transparent',
		display: 'block',
		fieldSizing: 'content',
		margin: 0,
		minHeight: rowsHeight(minRowsVar),
		outline: 'none',
		overflowY: 'hidden',
		position: 'relative',
		resize: 'none',
		width: '100%',
		zIndex: 20,
		selectors: {
			'&::placeholder': { color: vars.palette.contrast_500, opacity: 1 },
		},
	},
]);
