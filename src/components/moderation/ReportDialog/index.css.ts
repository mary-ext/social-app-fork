import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const popup = style({
	maxWidth: 500,
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	padding: 16,
});

export const prompt = style({
	paddingBottom: 4,
});

export const options = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const card = style({
	appearance: 'none',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	paddingBlock: 10,
	paddingInline: 12,
	textAlign: 'left',
	width: '100%',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_300 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const legal = style({
	alignItems: 'center',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxSizing: 'border-box',
	display: 'flex',
	gap: 8,
	paddingBlock: 10,
	paddingInline: 12,
	textDecoration: 'none',
	width: '100%',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_300 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const summary = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
});

export const changeLink = style({
	appearance: 'none',
	background: 'none',
	border: 'none',
	color: vars.palette.primary_500,
	cursor: 'pointer',
	font: 'inherit',
	padding: 0,
	selectors: {
		'&:hover': { textDecoration: 'underline' },
		'&:focus-visible': {
			borderRadius: 2,
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const grow = style({
	flex: 1,
	minWidth: 0,
});

export const labelerOption = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 2,
	minWidth: 0,
});

export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

export const center = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: 24,
});

export const loadingFallback = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	minHeight: 720,
});

export const srOnly = style({
	border: 0,
	clip: 'rect(0, 0, 0, 0)',
	height: 1,
	margin: -1,
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	whiteSpace: 'nowrap',
	width: 1,
});

export const doneButton = style({
	width: '100%',
});
