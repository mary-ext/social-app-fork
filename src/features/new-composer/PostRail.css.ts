import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { MOUSE } from '#/styles/interaction';
import { borderRadius, space } from '#/styles/tokens.css';

import { POST_ELEMENT } from './elements';

const GRIP_SIZE = 20;

/** gap between the drag handle and avatar, also used to align editor padding. */
export const GRIP_GAP = space.xs;

/** also the post's minimum height, so a single-line post still clears the avatar. */
export const AVATAR_SIZE = 36;

/** combined width of the drag handle, gap, and avatar. */
export const RAIL_WIDTH = GRIP_SIZE + GRIP_GAP + AVATAR_SIZE;

export const root = style({
	display: 'flex',
	position: 'absolute',
	top: 0,
	bottom: 0,
	left: 0,
	// single-post threads have no grip; keep the avatar column against the text either way.
	justifyContent: 'flex-end',
	gap: GRIP_GAP,
	width: RAIL_WIDTH,
});

export const grip = style({
	display: 'grid',
	flexShrink: 0,
	placeItems: 'center',
	borderRadius: borderRadius.xs,
	width: GRIP_SIZE,
	height: AVATAR_SIZE,
	color: vars.palette.contrast_400,
	pointerEvents: 'auto',
	cursor: 'grab',
	transition: 'opacity 100ms',
	selectors: {
		'&:hover': { color: vars.palette.contrast_700 },
		'&:active': { cursor: 'grabbing' },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

// keep the grip visible on touch devices.
globalStyle(`${MOUSE} ${POST_ELEMENT}:not(:hover) ${grip}`, {
	opacity: 0,
});

export const thread = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: space.xs,
	width: AVATAR_SIZE,
});

export const avatar = style({
	flexShrink: 0,
	borderRadius: '50%',
	backgroundColor: vars.palette.contrast_50,
	backgroundPosition: 'center',
	backgroundSize: 'cover',
	width: AVATAR_SIZE,
	height: AVATAR_SIZE,
});

export const line = style({
	flexGrow: 1,
	marginBottom: space.xs,
	backgroundColor: vars.palette.contrast_100,
	width: 2,
});
