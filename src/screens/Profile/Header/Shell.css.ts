import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const frame = style({
	backgroundColor: colors.bg,
	// positioning context for the absolutely-placed avatar (RN Views are relative by default).
	position: 'relative',
});

export const bannerRegion = style({
	height: 150,
	position: 'relative',
});

// bare button reset covering the banner; the back button is a sibling (not nested) to keep valid markup.
export const bannerButton = style({
	background: 'none',
	border: 0,
	cursor: 'pointer',
	display: 'block',
	height: '100%',
	padding: 0,
	width: '100%',
});

export const backButton = style({
	background: 'none',
	border: 0,
	cursor: 'pointer',
	left: 18,
	padding: 0,
	position: 'absolute',
	top: 10,
});

export const backButtonInner = style({
	alignItems: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	borderRadius: borderRadius.full,
	display: 'flex',
	height: 31,
	justifyContent: 'center',
	width: 31,
	selectors: {
		[`${backButton}:hover &`]: {
			backgroundColor: 'rgba(0, 0, 0, 0.75)',
		},
	},
});

export const avatarAnchor = style({
	left: 10,
	position: 'absolute',
	top: 104,
});

export const avatarButton = style({
	background: 'none',
	border: 0,
	borderRadius: borderRadius.full,
	cursor: 'pointer',
	display: 'block',
	padding: 0,
});

export const avatarRing = style({
	backgroundColor: colors.bg,
	borderColor: colors.bg,
	borderRadius: borderRadius.full,
	borderStyle: 'solid',
	borderWidth: 2,
	boxSizing: 'border-box',
	// flex so the box honors its width/height (an inline span would ignore them and collapse to a line).
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

// positioning context for the live badge, shrink-wrapped to the avatar so the badge centers on it.
export const avatarInner = style({
	display: 'flex',
	position: 'relative',
});

export const headerAlerts = style({
	paddingBottom: space.sm,
	paddingInline: space.lg,
	paddingTop: space.xs,
});
