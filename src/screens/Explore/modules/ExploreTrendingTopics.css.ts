import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

const rowBase = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const skeletonRow = rowBase;

export const row = style([
	rowBase,
	{
		textDecoration: 'none',
		color: 'inherit',
		cursor: 'pointer',
		':hover': {
			backgroundColor: colors.contrast_25,
		},
	},
]);

export const main = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});

export const rank = style({
	flexShrink: 0,
	width: 20,
	fontVariantNumeric: 'tabular-nums',
});

export const metaRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	marginTop: space.xs,
});
