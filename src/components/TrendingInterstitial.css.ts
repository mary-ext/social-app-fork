import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	alignItems: 'center',
	paddingInline: space.lg,
	overflowX: 'auto',
	scrollbarWidth: 'none',

	'::-webkit-scrollbar': {
		display: 'none',
	},
});

export const icon = style({
	width: iconSize.md,
	height: iconSize.md,
	color: colors.primary_600,
	flexShrink: 0,
});

export const topic = style({
	flexShrink: 0,
	paddingBlock: space.lg,
});

export const hideButton = style({
	flexShrink: 0,
	marginRight: -6,
});
