import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const body = style({
	paddingBottom: space.sm,
	paddingInline: space.lg,
	paddingTop: space.md,
});

export const buttonRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	justifyContent: 'flex-end',
	paddingBottom: space.lg,
});

export const nameBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	paddingBottom: space.md,
	paddingTop: space._2xs,
});

export const likeRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	paddingTop: space.lg,
});

export const subscribeButton = style({
	alignItems: 'center',
	borderRadius: 6,
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
	justifyContent: 'center',
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

// matches the padding the upstream `Link size="tiny"` gave the "Liked by" link (its text sits inset).
export const likedBy = style({
	paddingBlock: 5,
	paddingInline: 10,
});
