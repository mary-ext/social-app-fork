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
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	backgroundColor: vars.palette.contrast_25,
	paddingBlock: 10,
	paddingInline: 12,
	width: '100%',
	textAlign: 'left',
	cursor: 'pointer',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_300 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const legal = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: 8,
	alignItems: 'center',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	paddingBlock: 10,
	paddingInline: 12,
	width: '100%',
	textDecoration: 'none',
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
	border: 'none',
	background: 'none',
	padding: 0,
	color: vars.palette.primary_500,
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover': { textDecoration: 'underline' },
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
			borderRadius: 2,
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
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: 24,
});

export const loadingFallback = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: 720,
});

export const srOnly = style({
	position: 'absolute',
	margin: -1,
	border: 0,
	clip: 'rect(0, 0, 0, 0)',
	padding: 0,
	width: 1,
	height: 1,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
});

export const doneButton = style({
	width: '100%',
});
