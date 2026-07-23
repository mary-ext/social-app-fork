import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';

import { bubbleCorners } from './MessageItem.css';

export { bubbleCorners };

export const outer = style({
	width: '100%',
	minWidth: 280,
	maxWidth: 360,
});

/** tints the embed background by author, shared with the invite embed to keep the two in step. */
export const fromSelfBackground = {
	true: { background: colors.primary_50 },
	false: { background: colors.contrast_50 },
};

export const inner = recipe(
	{
		base: {
			overflow: 'hidden',
			border: 'none',
		},
		variants: {
			fromSelf: fromSelfBackground,
		},
	},
	{ debugId: 'messageItemEmbedInner' },
);
