import { style } from '@vanilla-extract/css';

import { borderRadius } from '#/styles/tokens.css';

export const root = style({
	borderRadius: borderRadius.md,
	display: 'flex',
	flex: 1,
	overflow: 'hidden',
	position: 'relative',
});

export const srOnly = style({
	border: 0,
	clip: 'rect(0 0 0 0)',
	height: 1,
	margin: -1,
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	whiteSpace: 'nowrap',
	width: 1,
});
