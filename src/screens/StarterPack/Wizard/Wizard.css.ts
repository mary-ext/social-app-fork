import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const HEADER_HEIGHT = 52;

export const searchBar = style({
	boxSizing: 'border-box',
	position: 'sticky',
	top: HEADER_HEIGHT,
	zIndex: zIndex.raised,
	borderBottom: `1px solid ${colors.borderContrastMedium}`,
	backgroundColor: colors.bg,
	paddingBlock: space.sm,
	paddingInline: space.md,
	height: 60,
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	marginTop: space.lg,
	paddingInline: space.lg,
});

export const emptyText = style({
	marginTop: space.lg,
});

export const details = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	marginTop: space._4xl,
	paddingInline: space.xl,
});

export const detailsHeader = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	marginBottom: space.md,
	paddingInline: space.md,
});

export const detailsSubtitle = style({
	paddingInline: space.md,
});

export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

export const detailsNext = style({
	marginTop: 35,
	marginBottom: space.lg,
	marginInline: space.xl,
});

export const footer = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'sticky',
	bottom: 0,
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	zIndex: zIndex.raised,
	marginTop: 'auto',
	borderTop: `1px solid ${colors.borderContrastMedium}`,
	backgroundColor: colors.bg,
	paddingTop: space.xl,
	paddingBottom: `calc(${space.lg}px + env(safe-area-inset-bottom, 0px))`,
	paddingInline: space.lg,
});

export const countBadge = style({
	position: 'absolute',
	top: 31,
	right: 14,
});

export const avatarRow = style({
	display: 'flex',
	flexDirection: 'row',
});

export const avatarRing = style({
	borderWidth: 0.5,
	borderStyle: 'solid',
	borderRadius: '50%',
	borderColor: colors.bg,
});

export const helperText = style({
	textAlign: 'center',
});

export const feedsEmptyHelper = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const cta = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	alignItems: 'center',
	marginTop: space.md,
	width: '100%',
});

export const ctaButton = style({
	width: '100%',
});
