import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hoverWithin } from '#/styles/interaction';
import { iconSize, space } from '#/styles/tokens.css';

/** also the post's minimum height, so a single-line post still clears the avatar. */
export const AVATAR_SIZE = 36;

export const root = style({
	display: 'flex',
	position: 'absolute',
	top: 0,
	bottom: 0,
	left: 0,
	flexDirection: 'column',
	alignItems: 'center',
	gap: space.xs,
	width: AVATAR_SIZE,
});

export const handle = style({
	display: 'block',
	position: 'relative',
	flexShrink: 0,
	border: 'none',
	borderRadius: '50%',
	background: 'none',
	padding: 0,
	width: AVATAR_SIZE,
	height: AVATAR_SIZE,
	cursor: 'grab',
	selectors: {
		'&:active': { cursor: 'grabbing' },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const handleOverlay = style({
	display: 'grid',
	position: 'absolute',
	inset: 0,
	placeItems: 'center',
	borderRadius: '50%',
	backgroundColor: 'rgba(0, 0, 0, 0.55)',
	opacity: 0,
	transition: 'opacity 100ms',
	color: vars.palette.white,
	selectors: {
		[hoverWithin(handle)]: { opacity: 1 },
		[`${handle}:focus-visible &, ${handle}[data-popup-open] &`]: { opacity: 1 },
	},
});

export const handleIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
});

export const line = style({
	flexGrow: 1,
	marginBottom: space.xs,
	backgroundColor: vars.palette.contrast_100,
	width: 2,
});
