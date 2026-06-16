import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: space._2xl,
	paddingInline: space.xl,
	textAlign: 'center',
});

export const badge = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_950,
	borderRadius: 9999,
	color: colors.textInverted,
	display: 'flex',
	height: 50,
	justifyContent: 'center',
	marginBottom: space.md,
	width: 50,
});

export const title = style({
	marginBottom: space.md,
});

export const message = style({
	marginBottom: space.xl,
});

export const details = style({
	alignSelf: 'stretch',
	backgroundColor: colors.contrast_25,
	border: `1px solid ${colors.borderContrastMedium}`,
	borderRadius: borderRadius.xs,
	marginBottom: space.xl,
	overflow: 'hidden',
	paddingBlock: space.sm,
	paddingInline: space.lg,
});
