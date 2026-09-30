import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

import { AVATAR_SIZE, POST_GAP_CENTER, RAIL_WIDTH } from '../layout';
import { DROP_TINT } from './drop.css';

// align with post content and the last post's rail.
export const root = style({
	display: 'flex',
	position: 'relative',
	alignItems: 'center',
	paddingBottom: POST_GAP_CENTER * 2,
	paddingLeft: RAIL_WIDTH,
	minHeight: AVATAR_SIZE,
	color: vars.palette.contrast_500,
});

export const active = style({
	selectors: {
		'&::before': DROP_TINT,
	},
});

export const avatar = style({
	boxSizing: 'border-box',
	display: 'grid',
	position: 'absolute',
	top: 0,
	left: space.lg,
	placeItems: 'center',
	border: '1px dashed currentColor',
	borderRadius: '50%',
	width: AVATAR_SIZE,
	height: AVATAR_SIZE,
});

export const icon = style({
	width: 24,
	height: 24,
});

// contrast_500 isn't a text color variant; inherit the zone's instead.
export const label = style({
	color: 'inherit',
});
