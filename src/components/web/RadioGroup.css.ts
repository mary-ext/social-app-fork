import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

export const group = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '8px',
	width: '100%',
});

export const item = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	font: 'inherit',
	gap: '8px',
	margin: 0,
	padding: 0,
	textAlign: 'left',
	width: '100%',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '2px' },
	},
});

export const circle = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: '999px',
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	height: '24px',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	width: '24px',
	selectors: {
		'[data-checked] &': {
			backgroundColor: vars.palette.primary_500,
			borderColor: vars.palette.primary_500,
		},
	},
});

/** The inner dot; Base UI only mounts the indicator when its radio is selected. */
export const dot = style({
	backgroundColor: vars.palette.white,
	borderRadius: '999px',
	height: '12px',
	width: '12px',
});

export const text = style({
	color: vars.palette.contrast_900,
	flex: 1,
	fontSize: fontSize.sm,
	fontWeight: 600,
	lineHeight: 1.15,
});
