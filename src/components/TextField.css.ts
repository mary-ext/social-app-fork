import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { ROUND_SIZE } from '#/components/web/Button.css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { layered } from '#/styles/layers';
import { components } from '#/styles/layers.css';
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
	display: 'flex',
	alignItems: 'baseline',
	justifyContent: 'space-between',
	marginBottom: 8,
});

export const input = style(
	layered(components, {
		appearance: 'none',
		boxSizing: 'border-box',
		display: 'block',
		margin: 0,
		outline: 'none',
		border: `${borderWidth}px solid transparent`,
		borderRadius: 10,
		backgroundColor: vars.palette.contrast_50,
		paddingBlock,
		paddingInline: 15,
		width: '100%',
		lineHeight,
		color: vars.palette.contrast_1000,
		fontFamily: 'inherit',
		fontSize: fontSize.md,
		selectors: {
			'&::placeholder': { color: vars.palette.contrast_500 },
			'&:disabled': { opacity: 0.5, cursor: 'default' },
			[hover(':not(:focus)')]: { borderColor: vars.palette.contrast_100 },
			'&:focus': { borderColor: vars.palette.primary_500, backgroundColor: vars.palette.primary_25 },
		},
	}),
);

export const invalid = style(
	layered(components, {
		borderColor: vars.palette.negative_300,
		backgroundColor: vars.palette.negative_25,
		selectors: {
			[hover(':not(:focus)')]: { borderColor: vars.palette.negative_500 },
			'&:focus': { borderColor: vars.palette.negative_500, backgroundColor: vars.palette.negative_25 },
		},
	}),
);

// keep equal top, bottom, and end gaps as the font scales.
const passwordToggleInset = `calc((${fontSize.md} * ${lineHeight} + ${
	paddingBlock * 2 + borderWidth * 2 - ROUND_SIZE.small
}px) / 2)`;

export const passwordRoot = style({
	position: 'relative',
});

export const passwordInput = style(
	layered(components, {
		paddingInlineEnd: `calc(${passwordToggleInset} * 2 + ${ROUND_SIZE.small}px)`,
	}),
);

export const passwordToggle = style({
	position: 'absolute',
	insetBlock: 0,
	insetInlineEnd: passwordToggleInset,
	marginBlock: 'auto',
	selectors: {
		// the default ghost hover blends into the field; tint its current background instead.
		[hover()]: { backgroundColor: `color-mix(in srgb, ${vars.palette.contrast_1000} 8%, transparent)` },
	},
});

export const multiline = style(
	layered(components, {
		fieldSizing: 'content',
		minHeight: 80,
		maxHeight: `calc(${fontSize.md} * ${lineHeight} * ${fallbackVar(maxRowsVar, '9999')} + ${
			paddingBlock * 2 + borderWidth * 2
		}px)`,
		resize: 'none',
		scrollPaddingBlock: paddingBlock,
	}),
);
