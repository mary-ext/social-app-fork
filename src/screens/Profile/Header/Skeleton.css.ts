import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const frame = style({
	backgroundColor: colors.bg,
	position: 'relative',
});

export const bannerRegion = style({
	height: 150,
	position: 'relative',
});

export const banner = style({
	backgroundColor: colors.contrast_50,
	borderRadius: 0,
	height: '100%',
	width: '100%',
});

export const avatarAnchor = style({
	left: 10,
	position: 'absolute',
	top: 104,
});

export const avatarRing = style({
	backgroundColor: colors.bg,
	borderColor: colors.bg,
	borderRadius: borderRadius.full,
	borderStyle: 'solid',
	borderWidth: 2,
	boxSizing: 'border-box',
	display: 'flex',
	height: 94,
	width: 94,
});

export const body = style({
	overflow: 'hidden',
	paddingBottom: space.sm,
	paddingInline: space.lg,
	paddingTop: space.md,
});

export const buttonRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
	paddingBottom: space.sm,
	paddingLeft: 90,
});

export const actionPill = style({
	backgroundColor: colors.contrast_50,
	borderRadius: borderRadius.full,
	flexShrink: 0,
	height: 33,
	width: 132,
});

export const nameBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	paddingBottom: space.sm,
	paddingTop: space._2xs,
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const metricsRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});
