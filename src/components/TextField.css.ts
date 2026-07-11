import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontSize } from '#/styles/tokens.css';

const borderWidth = 1;
const lineHeight = 1.2;
const paddingBlock = 12;

export const maxRowsVar = createVar();

export const root = style(
	layered(components, {
		display: 'flex',
		flexDirection: 'column',
	}),
);

export const label = style({
	display: 'block',
	marginBottom: 8,
});

export const labelRow = style({
	alignItems: 'baseline',
	display: 'flex',
	justifyContent: 'space-between',
	marginBottom: 8,
});

export const input = style(
	layered(components, {
		appearance: 'none',
		backgroundColor: vars.palette.contrast_50,
		border: `${borderWidth}px solid transparent`,
		borderRadius: 10,
		boxSizing: 'border-box',
		color: vars.palette.contrast_1000,
		display: 'block',
		fontFamily: 'inherit',
		fontSize: fontSize.md,
		lineHeight,
		margin: 0,
		outline: 'none',
		paddingBlock,
		paddingInline: 15,
		width: '100%',
		selectors: {
			'&::placeholder': { color: vars.palette.contrast_500 },
			'&:hover': { borderColor: vars.palette.contrast_100 },
			'&:focus': { backgroundColor: vars.palette.primary_25, borderColor: vars.palette.primary_500 },
		},
	}),
);

export const invalid = style(
	layered(components, {
		backgroundColor: vars.palette.negative_25,
		borderColor: vars.palette.negative_300,
		selectors: {
			'&:hover': { borderColor: vars.palette.negative_500 },
			'&:focus': { backgroundColor: vars.palette.negative_25, borderColor: vars.palette.negative_500 },
		},
	}),
);

export const multiline = style(
	layered(components, {
		fieldSizing: 'content',
		maxHeight: `calc(${fontSize.md} * ${lineHeight} * ${fallbackVar(maxRowsVar, '9999')} + ${
			paddingBlock * 2 + borderWidth * 2
		}px)`,
		minHeight: 80,
		resize: 'none',
		scrollPaddingBlock: paddingBlock,
	}),
);
