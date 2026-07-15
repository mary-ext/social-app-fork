import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const frame = style({
	backgroundColor: colors.bg,
	position: 'relative',
});

export const bannerButton = style({
	background: 'none',
	border: 0,
	cursor: 'pointer',
	display: 'block',
	padding: 0,
	width: '100%',
});

export const bannerPlaceholder = style({
	aspectRatio: '3 / 1',
	backgroundColor: colors.contrast_50,
	width: '100%',
});

// empty marker at the banner's bottom edge; the avatar anchors to it to straddle the banner at any height
export const avatarAnchor = style({
	position: 'relative',
});

export const avatarBox = style({
	display: 'block',
	left: 10,
	position: 'absolute',
	top: -46, // straddle the banner's bottom edge
});

export const avatarButton = style([
	avatarBox,
	{
		background: 'none',
		border: 0,
		borderRadius: borderRadius.full,
		cursor: 'pointer',
		padding: 0,
	},
]);

export const avatarRing = style({
	backgroundColor: colors.bg,
	borderColor: colors.bg,
	borderRadius: borderRadius.full,
	borderStyle: 'solid',
	borderWidth: 2,
	boxSizing: 'border-box',
	display: 'flex',
	height: 94,
	position: 'relative',
	width: 94,
});

export const avatarRingLive = style({
	borderColor: colors.negative_500,
	borderWidth: 3,
});

export const avatarRingLabeler = style({
	borderRadius: borderRadius.md,
});

export const avatarInner = style({
	display: 'flex',
	position: 'relative',
});

export const headerAlerts = style({
	paddingBottom: space.sm,
	paddingInline: space.lg,
	paddingTop: space.xs,
});
