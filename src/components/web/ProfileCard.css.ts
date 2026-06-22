import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

/** Placeholder edge length in px, wired inline so it scales to the `size` prop. */
export const avatarSizeVar = createVar();

export const outer = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.xs,
	width: '100%',
});

/** Block link wrapping a card row; the caller supplies the row layout (direction/alignment/gap). */
export const link = style({
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	textDecoration: 'none',
});

export const avatarPlaceholder = style({
	background: colors.contrast_50,
	borderRadius: borderRadius.full,
	height: avatarSizeVar,
	width: avatarSizeVar,
});

export const nameAndHandlePlaceholder = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.xs,
});

export const namePlaceholderBar = style({
	background: colors.contrast_50,
	borderRadius: borderRadius.xs,
	height: 14,
	width: '60%',
});

export const handlePlaceholderBar = style({
	background: colors.contrast_50,
	borderRadius: borderRadius.xs,
	height: 10,
	width: '40%',
});

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const nameAndHandle = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	maxWidth: '100%',
});

export const nameText = style({
	alignSelf: 'flex-start',
	flexShrink: 1,
});

export const badges = style({
	paddingLeft: space.xs,
});

export const inlineRow = style({
	alignItems: 'flex-end',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
});

export const inlineName = style({
	flexShrink: 0,
	maxWidth: '70%',
});

export const inlineBadges = style({
	alignSelf: 'center',
	paddingLeft: space._2xs,
});

export const inlineHandle = style({
	flexShrink: 10,
});
