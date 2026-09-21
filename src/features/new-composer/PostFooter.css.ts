import { style } from '@vanilla-extract/css';

import { iconSize, space } from '#/styles/tokens.css';

import { RIGHT_PADDING } from './consts';
import { revealOnHover } from './reveal.css';

export const root = style([
	revealOnHover,
	{
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: space.sm,
		paddingTop: space.md,
		paddingRight: RIGHT_PADDING,
	},
]);

const ICON_BUTTON_SIZE = 33;
const ICON_OFFSET = -(ICON_BUTTON_SIZE - iconSize.lg) / 2;

export const actions = style({
	display: 'flex',
	alignItems: 'center',
	gap: space._2xs,
	margin: ICON_OFFSET,
});

export const status = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
	marginBlock: ICON_OFFSET,
});

export const language = style({
	minWidth: ICON_BUTTON_SIZE,
	paddingInline: space.sm,
	textTransform: 'uppercase',
});
