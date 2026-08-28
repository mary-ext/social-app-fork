import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

const AVATAR_SIZE = 94;

const AVATAR_LIFT = 46;

export const AVATAR_OVERHANG = AVATAR_SIZE - AVATAR_LIFT;

export const frame = style({
	position: 'relative',
	backgroundColor: colors.bg,
});

export const bannerButton = style({
	display: 'block',
	border: 0,
	background: 'none',
	padding: 0,
	width: '100%',
	cursor: 'pointer',
});

// empty marker at the banner's bottom edge; the avatar anchors to it to straddle the banner at any height
export const avatarAnchor = style({
	position: 'relative',
});

export const avatarBox = style({
	display: 'block',
	position: 'absolute',
	// straddle the banner's bottom edge
	top: -AVATAR_LIFT,
	left: 10,
});

export const avatarButton = style([
	avatarBox,
	{
		border: 0,
		borderRadius: borderRadius.full,
		background: 'none',
		padding: 0,
		cursor: 'pointer',
	},
]);

export const avatarRing = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	borderWidth: 2,
	borderStyle: 'solid',
	borderRadius: borderRadius.full,
	borderColor: colors.bg,
	backgroundColor: colors.bg,
	width: AVATAR_SIZE,
	height: AVATAR_SIZE,
});

export const avatarRingLive = style({
	borderWidth: 3,
	borderColor: colors.negative_500,
});

export const avatarRingLabeler = style({
	borderRadius: borderRadius.md,
});

export const avatarInner = style({
	display: 'flex',
	position: 'relative',
});

export const headerAlerts = style({
	paddingTop: space.xs,
	paddingBottom: space.sm,
	paddingInline: space.lg,
});
