import { style } from '@vanilla-extract/css';

import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

import { bubbleCorners, fromSelfBackground, outer } from './MessageItemEmbed.css';

export { bubbleCorners, outer };

export const inner = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			gap: space.md,
			padding: space.md,
			overflow: 'hidden',
		},
		variants: {
			fromSelf: fromSelfBackground,
		},
	},
	{ debugId: 'messageInviteEmbedInner' },
);

export const loadingPad = style({
	paddingBlock: 16,
});

export const errorPad = style({
	paddingBlock: 8,
});
