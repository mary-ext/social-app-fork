import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	overflowX: 'auto',
	paddingInline: space.lg,
	scrollbarWidth: 'none',

	'::-webkit-scrollbar': {
		display: 'none',
	},
});

export const icon = style({
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
