import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

export const outer = style({
	padding: space.md,
	paddingBottom: `calc(${space.md}px + env(safe-area-inset-bottom, 0px))`,
});

export const card = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	padding: space.lg,
	borderRadius: 40,
	background: colors.contrast_50,
});

export const icon = style({
	width: iconSize.xl,
	height: iconSize.xl,
	color: colors.text,
	marginBottom: space.xs,
});

export const heading = style({
	marginBottom: space.xs,
});

export const button = style({
	width: '100%',
	marginTop: space.lg,
});
