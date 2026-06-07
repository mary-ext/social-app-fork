import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	backgroundColor: vars.palette.contrast_0,
	borderRadius: 8,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	padding: 12,
	width: '100%',
});

export const border = styleVariants({
	apology: { borderColor: vars.palette.contrast_300 },
	error: { borderColor: vars.palette.negative_500 },
	info: { borderColor: vars.palette.contrast_300 },
	tip: { borderColor: vars.palette.primary_500 },
	warning: { borderColor: vars.palette.yellow },
});

export const row = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	width: '100%',
});

export const iconWrap = style({
	display: 'flex',
	flexShrink: 0,
});

export const iconColor = styleVariants({
	apology: { color: vars.palette.contrast_700 },
	error: { color: vars.palette.negative_500 },
	info: { color: vars.palette.contrast_700 },
	tip: { color: vars.palette.primary_500 },
	warning: { color: vars.palette.yellow },
});

export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 8,
	justifyContent: 'center',
	minHeight: 20,
	paddingRight: 12,
});
