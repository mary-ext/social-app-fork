import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const HEADER_HEIGHT = 52;

export const searchBar = style({
	backgroundColor: colors.bg,
	borderBottom: `1px solid ${colors.borderContrastMedium}`,
	boxSizing: 'border-box',
	height: 60,
	paddingBlock: space.sm,
	paddingInline: space.md,
	position: 'sticky',
	top: HEADER_HEIGHT,
	zIndex: zIndex.sticky,
});

export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
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
	marginBottom: space.lg,
	marginInline: space.xl,
	marginTop: 35,
});

export const footer = style({
	alignItems: 'center',
	backgroundColor: colors.bg,
	borderTop: `1px solid ${colors.borderContrastMedium}`,
	bottom: 0,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	marginTop: 'auto',
	paddingBottom: `calc(${space.lg}px + env(safe-area-inset-bottom, 0px))`,
	paddingInline: space.lg,
	paddingTop: space.xl,
	position: 'sticky',
	zIndex: zIndex.sticky,
});

export const countBadge = style({
	position: 'absolute',
	right: 14,
	top: 31,
});

export const avatarRow = style({
	display: 'flex',
	flexDirection: 'row',
});

export const avatarRing = style({
	borderColor: colors.bg,
	borderRadius: '50%',
	borderStyle: 'solid',
	borderWidth: 0.5,
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	marginTop: space.md,
	width: '100%',
});

export const ctaButton = style({
	width: '100%',
});
