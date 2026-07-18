import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

const row = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: space.sm,
	paddingInline: space.lg,
});

export const memberRow = style([
	row,
	{
		selectors: {
			'&:focus-visible': {
				outline: `2px solid ${colors.primary_500}`,
				outlineOffset: -2,
				backgroundColor: colors.contrast_25,
			},
			'&:hover': { backgroundColor: colors.contrast_25 },
		},
	},
]);

export const placeholderRow = style([row]);

export const header = style({
	display: 'flex',
	gap: space.md,
	alignItems: 'start',
});

export const nameColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const joinedReason = style({
	paddingTop: space.xs,
});

export const menuButton = style({
	marginBlock: -6.5,
	marginInline: -8,
});
