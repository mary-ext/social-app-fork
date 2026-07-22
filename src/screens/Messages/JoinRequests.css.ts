import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const loadingFill = style({
	display: 'flex',
	flex: 1,
	alignItems: 'center',
	justifyContent: 'center',
});

export const emptyFill = style({
	display: 'flex',
	flex: 1,
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._4xl,
});

export const errorFill = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: space.sm,
	padding: space.lg,
});

export const errorText = style({
	paddingInline: space.lg,
});

export const errorButton = style({
	marginTop: space.md,
});

export const item = style({
	position: 'relative',
	flex: 1,
	padding: space.lg,
});

export const itemRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: space.md,
});

export const knownFollowers = style({
	marginTop: space.xs,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: space.sm,
	marginTop: space.md,
});

export const footer = style({
	position: 'absolute',
	left: 0,
	right: 0,
	bottom: 0,
	paddingInline: space.xl,
	borderTop: `1px solid ${colors.borderContrastLow}`,
	background: colors.bg,
});
