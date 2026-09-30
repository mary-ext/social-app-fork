import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

import { AVATAR_SIZE, POST_GAP_CENTER, RAIL_WIDTH } from './layout';

/** shared alignment for the add-post button and drop zone. */
export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	alignItems: 'center',
	paddingBottom: POST_GAP_CENTER * 2,
	paddingLeft: RAIL_WIDTH,
	width: '100%',
	minHeight: AVATAR_SIZE + POST_GAP_CENTER * 2,
	color: vars.palette.contrast_600,
});

/** avatar slot centered on the thread line. */
export const avatarSlot = style({
	position: 'absolute',
	top: 0,
	left: space.lg,
	width: AVATAR_SIZE,
	height: AVATAR_SIZE,
});

// override Text's default color with the row's.
export const label = style({
	color: 'inherit',
});
