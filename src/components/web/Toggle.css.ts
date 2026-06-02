import { style } from '@vanilla-extract/css';

import { fontSize } from '#/styles/tokens';

import { vars } from '#/styles/contract.css';

const textMd = `calc(var(--font-scale, 1) * ${fontSize.md}px)`;

export const group = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '2px',
	width: '100%',
});

export const row = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_50,
	border: 'none',
	borderRadius: '4px',
	boxSizing: 'border-box',
	color: vars.palette.contrast_700,
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	font: 'inherit',
	gap: '8px',
	margin: 0,
	minHeight: '48px',
	paddingBlock: '12px',
	paddingInline: '12px',
	textAlign: 'left',
	width: '100%',
	selectors: {
		'&:first-child': { borderTopLeftRadius: '12px', borderTopRightRadius: '12px' },
		'&:last-child': { borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' },
		'&[data-checked]': { backgroundColor: vars.palette.primary_50 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '-2px' },
	},
});

export const box = style({
	alignItems: 'center',
	border: `1px solid ${vars.palette.contrast_300}`,
	borderRadius: '6px',
	boxSizing: 'border-box',
	color: vars.palette.white,
	display: 'flex',
	flexShrink: 0,
	height: '24px',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	width: '24px',
	selectors: {
		[`${row}[data-checked] &`]: {
			backgroundColor: vars.palette.primary_500,
			borderColor: vars.palette.primary_500,
		},
	},
});

export const indicator = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
});

export const text = style({
	flex: 1,
	fontSize: textMd,
	selectors: {
		[`${row}[data-checked] &`]: {
			color: vars.palette.contrast_1000,
			fontWeight: 500,
		},
	},
});

export const actionIcon = style({
	alignItems: 'center',
	color: 'inherit',
	display: 'flex',
	flexShrink: 0,
});
