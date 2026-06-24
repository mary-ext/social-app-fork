import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import { GRID_HEIGHT, PANEL_WIDTH } from '../layout';

const rotate = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
});

// spins the icon in place (sized by the icon itself), unlike the global `.rotate-500ms` helper which is
// `position:absolute; inset:0` and would stretch across the whole placeholder.
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
