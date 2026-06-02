import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	backgroundColor: vars.palette.contrast_0,
	borderRadius: '8px',
	borderStyle: 'solid',
	borderWidth: '1px',
	padding: '12px',
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
	gap: '8px',
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
	gap: '8px',
	justifyContent: 'center',
	minHeight: '20px',
	paddingRight: '12px',
});
