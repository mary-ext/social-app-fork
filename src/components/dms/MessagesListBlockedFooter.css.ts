import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const outer = style({
	padding: space.md,
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
	marginBottom: space.xs,
});

export const heading = style({
	marginBottom: space.xs,
});

export const button = style({
	width: '100%',
	marginTop: space.lg,
});
