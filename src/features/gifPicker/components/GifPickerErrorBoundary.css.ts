import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	padding: space._2xl,
	textAlign: 'center',
});

export const details = style({
	boxSizing: 'border-box',
	borderRadius: borderRadius.sm,
	backgroundColor: vars.palette.contrast_25,
	padding: space.md,
	width: '100%',
	maxHeight: 160,
	overflow: 'auto',
	textAlign: 'left',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	color: vars.palette.contrast_500,
	fontFamily: `ui-monospace, SFMono-Regular, Menlo, monospace`,
	fontSize: 12,
});
