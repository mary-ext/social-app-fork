import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import { GRID_HEIGHT, PANEL_WIDTH } from '../layout';

const rotate = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
});

export const spinner = style({
	animation: `${rotate} 500ms linear infinite`,
});

export const placeholder = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	boxShadow: vars.shadow.lg,
	boxSizing: 'content-box',
	color: vars.palette.contrast_900,
	display: 'flex',
	height: GRID_HEIGHT + 96,
	justifyContent: 'center',
	width: PANEL_WIDTH,
});
