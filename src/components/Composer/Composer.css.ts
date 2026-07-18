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
	lineHeight: lineHeightValue,
	letterSpacing: 'normal',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	fontFamily: 'inherit',
	fontSize: fontSizeValue,
});

const padding = style({
	paddingTop: paddingTopVar,
	paddingRight: paddingRightVar,
	paddingBottom: paddingBottomVar,
	paddingLeft: paddingLeftVar,
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
	scrollPaddingTop: paddingTopVar,
	scrollPaddingBottom: paddingBottomVar,
	scrollbarWidth: 'thin',
	scrollbarColor: `${vars.palette.contrast_200} transparent`,
});

export const overlay = style([
	textMetrics,
	padding,
	{
		position: 'absolute',
		top: 0,
		right: 0,
		left: 0,
		zIndex: 10,
		color: vars.palette.contrast_1000,
		pointerEvents: 'none',
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
		boxSizing: 'border-box',
		display: 'block',
		position: 'relative',
		zIndex: 20,
		margin: 0,
		outline: 'none',
		border: 0,
		background: 'transparent',
		fieldSizing: 'content',
		width: '100%',
		minHeight: rowsHeight(minRowsVar),
		overflowY: 'hidden',
		resize: 'none',
		color: 'transparent',
		caretColor: vars.palette.contrast_1000,
		selectors: {
			'&::placeholder': { opacity: 1, color: vars.palette.contrast_500 },
		},
	},
]);
