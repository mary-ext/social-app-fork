import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

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

export const bannerPlaceholder = style({
	backgroundColor: colors.contrast_50,
	aspectRatio: '3 / 1',
	width: '100%',
});

// empty marker at the banner's bottom edge; the avatar anchors to it to straddle the banner at any height
export const avatarAnchor = style({
	position: 'relative',
});

export const avatarBox = style({
	display: 'block',
	position: 'absolute',
	// straddle the banner's bottom edge
	top: -46,
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
	width: 94,
	height: 94,
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
