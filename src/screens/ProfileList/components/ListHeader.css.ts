import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const outer = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			gap: space.lg,
			paddingInline: space.lg,
		},
		defaultVariants: { bottomBorder: false },
		variants: {
			bottomBorder: {
				false: {
					paddingBottom: space.sm,
				},
				true: {
					paddingBottom: space.lg,
					borderBottom: `1px solid ${vars.palette.contrast_100}`,
				},
			},
		},
	},
	{ debugId: 'outer' },
);

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'flex-start',
});

export const avatarButton = style({
	appearance: 'none',
	display: 'block',
	border: 'none',
	background: 'none',
	padding: 0,
	cursor: 'pointer',
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	gap: space._2xs,
	paddingBlock: (56 - 50) / 2,
	minWidth: 0,
});
