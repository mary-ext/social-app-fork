import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';

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
		[hover()]: { borderColor: vars.palette.contrast_300 },
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
	color: vars.text.link,
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		[hover()]: { textDecoration: 'underline' },
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
			borderRadius: 2,
		},
	},
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
	transform: 'scale(0)',
});

export const doneButton = style({
	width: '100%',
});
