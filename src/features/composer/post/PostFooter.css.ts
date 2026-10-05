import { style } from '@vanilla-extract/css';

import { fontWeight, iconSize, space } from '#/styles/tokens.css';

import { control } from '../editor/post-overlays.css';
import { RIGHT_PADDING } from '../shared/layout';
import { revealOnHover } from '../shared/reveal.css';

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

export const actions = style([
	control,
	{
		display: 'flex',
		alignItems: 'center',
		gap: space._2xs,
		margin: ICON_OFFSET,
	},
]);

export const status = style([
	control,
	{
		display: 'flex',
		alignItems: 'center',
		gap: space.sm,
		marginBlock: ICON_OFFSET,
	},
]);

export const language = style({
	minWidth: ICON_BUTTON_SIZE,
	paddingInline: space.sm,
	fontWeight: fontWeight.bold,
	textTransform: 'uppercase',
});
