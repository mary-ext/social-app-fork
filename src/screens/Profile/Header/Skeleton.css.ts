import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const frame = style({
	position: 'relative',
	backgroundColor: colors.bg,
});

// mirror the loaded header so the skeleton doesn't shift on load
export const banner = style({
	backgroundColor: colors.contrast_50,
	aspectRatio: '3 / 1',
	width: '100%',
});

export const avatarAnchor = style({
	position: 'relative',
});

export const avatarRing = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'absolute',
	// straddle the banner's bottom edge
	top: -46,
	left: 10,
	borderWidth: 2,
	borderStyle: 'solid',
	borderRadius: borderRadius.full,
	borderColor: colors.bg,
	backgroundColor: colors.bg,
	width: 94,
	height: 94,
});

export const body = style({
	paddingTop: space.md,
	paddingBottom: space.sm,
	paddingInline: space.lg,
	overflow: 'hidden',
});

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'flex-end',
	paddingBottom: space.sm,
	paddingLeft: 90,
});

export const actionPill = style({
	flexShrink: 0,
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_50,
	width: 132,
	height: 33,
});

export const nameBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	paddingTop: space._2xs,
	paddingBottom: space.sm,
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const metricsRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});
