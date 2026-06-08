import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	padding: space._2xl,
	textAlign: 'center',
});

// the raw error string, kept monospace and scroll-clamped so a long stack doesn't blow out the dialog.
export const details = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: borderRadius.sm,
	boxSizing: 'border-box',
	color: vars.palette.contrast_500,
	fontFamily: `ui-monospace, SFMono-Regular, Menlo, monospace`,
	fontSize: 12,
	maxHeight: 160,
	overflow: 'auto',
	padding: space.md,
	textAlign: 'left',
	whiteSpace: 'pre-wrap',
	width: '100%',
	wordBreak: 'break-word',
});
