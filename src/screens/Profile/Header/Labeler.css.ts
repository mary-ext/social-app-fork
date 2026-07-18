import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const body = style({
	paddingTop: space.md,
	paddingBottom: space.sm,
	paddingInline: space.lg,
});

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
	justifyContent: 'flex-end',
	paddingBottom: space.lg,
});

export const nameBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	paddingTop: space._2xs,
	paddingBottom: space.md,
});

export const likeRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
	paddingTop: space.lg,
});

export const subscribeButton = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 6,
	paddingBlock: 9,
	paddingInline: 12,
});

export const subscribed = style({
	backgroundColor: colors.contrast_25,
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_50 },
	},
});

export const unsubscribed = style({
	backgroundColor: 'rgb(105 0 255)',
	selectors: {
		'&:hover': { backgroundColor: 'rgb(83 0 202)' },
	},
});

export const likedBy = style({
	paddingBlock: 5,
	paddingInline: 10,
});
