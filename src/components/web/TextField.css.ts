import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontFamily, fontSize } from '#/styles/tokens.css';

export const label = style(
	layered(components, {
		color: vars.palette.contrast_700,
		display: 'block',
		fontFamily,
		fontSize: fontSize.sm,
		fontWeight: 500,
		marginBottom: 8,
	}),
);

export const input = style(
	layered(components, {
		appearance: 'none',
		backgroundColor: vars.palette.contrast_50,
		border: '1px solid transparent',
		borderRadius: 10,
		boxSizing: 'border-box',
		color: vars.palette.contrast_1000,
		display: 'block',
		fontFamily,
		fontSize: fontSize.md,
		lineHeight: 1.2,
		margin: 0,
		outline: 'none',
		paddingBlock: 12,
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
		minHeight: 80,
		resize: 'none',
	}),
);
