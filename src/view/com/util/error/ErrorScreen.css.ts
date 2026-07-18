import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingBlock: space._2xl,
	paddingInline: space.xl,
	textAlign: 'center',
});

export const badge = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	marginBottom: space.md,
	borderRadius: 9999,
	backgroundColor: colors.contrast_950,
	width: 50,
	height: 50,
	color: colors.textInverted,
});

export const title = style({
	marginBottom: space.md,
});

export const message = style({
	marginBottom: space.xl,
});

export const details = style({
	alignSelf: 'stretch',
	marginBottom: space.xl,
	border: `1px solid ${colors.borderContrastMedium}`,
	borderRadius: borderRadius.xs,
	backgroundColor: colors.contrast_25,
	paddingBlock: space.sm,
	paddingInline: space.lg,
	overflow: 'hidden',
});
