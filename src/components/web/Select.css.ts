import { style } from '@vanilla-extract/css';

import { fontSize } from '#/styles/tokens';

import { vars } from '#/styles/contract.css';

const textSm = `calc(var(--font-scale, 1) * ${fontSize.sm}px)`;

export const trigger = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	border: `1px solid ${vars.palette.contrast_50}`,
	borderRadius: '10px',
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	cursor: 'pointer',
	display: 'flex',
	fontSize: textSm,
	gap: '8px',
	justifyContent: 'space-between',
	maxWidth: '400px',
	outline: 0,
	paddingBlock: '8px',
	paddingInline: '12px',
	width: '100%',
	selectors: {
		'&:focus-visible': { borderColor: vars.palette.primary_500 },
		'&[data-popup-open]': { borderColor: vars.palette.primary_500 },
	},
});

export const value = style({
	overflow: 'hidden',
	textAlign: 'left',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const icon = style({
	alignItems: 'center',
	color: vars.palette.contrast_1000,
	display: 'flex',
	flexShrink: 0,
});

export const positioner = style({
	zIndex: 10,
});

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: '8px',
	boxShadow: vars.shadow.md,
	boxSizing: 'border-box',
	maxHeight: 'var(--available-height)',
	overflowY: 'auto',
});

export const list = style({
	padding: '4px',
});

export const item = style({
	alignItems: 'center',
	borderRadius: '4px',
	color: vars.palette.contrast_1000,
	cursor: 'pointer',
	display: 'flex',
	fontSize: textSm,
	minHeight: '25px',
	outline: 0,
	paddingBlock: '2px',
	paddingLeft: '30px',
	paddingRight: '8px',
	position: 'relative',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	userSelect: 'none',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.primary_50 },
		'&[data-selected]': { fontWeight: 600 },
	},
});

export const indicator = style({
	alignItems: 'center',
	color: vars.palette.primary_500,
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	position: 'absolute',
	width: '30px',
});
