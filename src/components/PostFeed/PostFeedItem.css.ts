import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const spineSlot = style({
	display: 'flex',
	flexDirection: 'column',
});

export const reason = style({
	display: 'flex',
	flexDirection: 'column',
	paddingTop: 10,
	paddingBottom: 2,
});

export const replyLineTop = style({
	marginBottom: space.xs,
});

export const replyLineParent = style({
	marginTop: space.xs,
});

export const replyLineParentLive = style({
	marginTop: space.sm,
});

export const metaSpacing = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	alignItems: 'center',
	paddingBottom: space.xs,
});

export const repliedTo = style({
	paddingBottom: space.xs,
});
