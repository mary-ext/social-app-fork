import { createVar, fallbackVar, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover, hoverWithin } from '#/styles/interaction';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize, iconSize } from '#/styles/tokens.css';

const iconSizeVar = createVar();
const inputPaddingVar = createVar();

const BORDER_WIDTH = 1;
const INPUT_PADDING = 10;
const LINE_HEIGHT = roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`);

/** rendered height of a default-size field; follows the user's font scale. */
export const FIELD_HEIGHT = `calc(${LINE_HEIGHT} + ${2 * (INPUT_PADDING + BORDER_WIDTH)}px)`;

export const field = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: 8,
	alignItems: 'center',
	border: `${BORDER_WIDTH}px solid transparent`,
	borderRadius: 10,
	backgroundColor: vars.palette.contrast_50,
	paddingInline: 12,
	width: '100%',
	cursor: 'text',
	selectors: {
		// hover must not override focus styles.
		[hover(':not(:has(input:focus), :focus-visible)')]: { borderColor: vars.palette.contrast_100 },
		'&:has(input:focus), &:focus-visible': {
			borderColor: vars.palette.primary_500,
			backgroundColor: vars.palette.primary_25,
		},
	},
});

export const shape = styleVariants({
	default: {},
	round: { borderRadius: 999, paddingInline: 14 },
});

export const size = styleVariants({
	default: {},
	small: { vars: { [iconSizeVar]: `${iconSize.md}px`, [inputPaddingVar]: '7px' } },
});

export const icon = style({
	width: fallbackVar(iconSizeVar, `${iconSize.lg}px`),
	height: fallbackVar(iconSizeVar, `${iconSize.lg}px`),
	flexShrink: 0,
	color: vars.palette.contrast_500,
	pointerEvents: 'none',
	selectors: {
		[hoverWithin(field, ':not(:has(input:focus), :focus-visible)')]: { color: vars.palette.contrast_800 },
		[`${field}:has(input:focus) &, ${field}:focus-visible &`]: { color: vars.palette.primary_500 },
	},
});

const text = style({
	flex: 1,
	paddingBlock: fallbackVar(inputPaddingVar, `${INPUT_PADDING}px`),
	minWidth: 0,
	lineHeight: LINE_HEIGHT,
	color: vars.palette.contrast_1000,
	fontSize: fontSize.md,
});

export const input = style([
	text,
	{
		appearance: 'none',
		margin: 0,
		outline: 'none',
		border: 'none',
		backgroundColor: 'transparent',
		paddingInline: 0,
		fontFamily: 'inherit',
		selectors: {
			'&::placeholder': { color: vars.palette.contrast_500, userSelect: 'none' },
		},
	},
]);

export const trigger = style({
	appearance: 'none',
	margin: 0,
	outline: 'none',
	paddingBlock: 0,
	textAlign: 'start',
	cursor: 'pointer',
});

export const value = style([
	text,
	{
		overflow: 'hidden',
		// preserve input whitespace so highlight offsets still match.
		whiteSpace: 'pre',
		textOverflow: 'ellipsis',
	},
]);

export const placeholder = style({
	color: vars.palette.contrast_500,
});

export const clear = style({
	flexShrink: 0,
	selectors: {
		[`${field} > &`]: { marginInlineEnd: -6 },
	},
});

export const slot = style({
	display: 'flex',
	flexShrink: 0,
	gap: 4,
	alignItems: 'center',
	marginInlineEnd: -6,
});
