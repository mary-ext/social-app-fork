import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const nameAndHandle = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	maxWidth: '100%',
});

export const nameText = style({
	alignSelf: 'flex-start',
	flexShrink: 1,
});

export const badges = style({
	paddingLeft: space.xs,
});

export const inlineRow = style({
	alignItems: 'flex-end',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
});

export const inlineName = style({
	flexShrink: 0,
	maxWidth: '70%',
});

export const inlineBadges = style({
	alignSelf: 'center',
	paddingLeft: space._2xs,
});

export const inlineHandle = style({
	flexShrink: 10,
});
