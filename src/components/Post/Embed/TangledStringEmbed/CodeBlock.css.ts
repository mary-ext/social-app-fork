import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { fontSize, monoFontFamily, space } from '#/styles/tokens.css';

import { codeLineHeight, codePaddingBlock, codeTextSize } from './metrics';

export const block = style({
	boxSizing: 'border-box',
	margin: 0,
	width: '100%',
	paddingBlock: codePaddingBlock,
	color: colors.text,
	fontFamily: monoFontFamily,
	fontSize: fontSize[codeTextSize],
	lineHeight: codeLineHeight,
	tabSize: 4,
});

const grid = style({
	display: 'grid',
	fontFamily: 'inherit',
	fontSize: 'inherit',
});

export const gridClip = style([
	grid,
	{
		gridTemplateColumns: 'max-content minmax(0, 1fr)',
	},
]);

export const gridScroll = style([
	grid,
	{
		gridTemplateColumns: 'max-content max-content',
		minWidth: '100%',
		width: 'max-content',
	},
]);

export const gutter = style({
	alignSelf: 'start',
	paddingRight: space.sm,
	paddingLeft: space.md,
	color: colors.textContrastLow,
	fontFamily: 'inherit',
	fontSize: 'inherit',
	lineHeight: 'inherit',
	textAlign: 'right',
	fontVariantNumeric: 'tabular-nums',
	userSelect: 'none',
});

export const gutterScroll = style([
	gutter,
	{
		position: 'sticky',
		left: 0,
		backgroundColor: colors.contrast_25,
	},
]);

export const gutterSkeleton = style([
	gutter,
	{
		display: 'flex',
		boxSizing: 'content-box',
		justifyContent: 'flex-end',
		width: '2ch',
	},
]);

export const row = style({
	paddingRight: space.md,
});

export const rowClip = style([
	row,
	{
		overflow: 'hidden',
		maskImage: `linear-gradient(to right, #000 calc(100% - ${space._2xl}px), transparent)`,
	},
]);
