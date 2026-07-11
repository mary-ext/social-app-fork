import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const reasonRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const spineSlot = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	width: 36,
});

export const reason = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 1,
	minWidth: 0,
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	paddingBottom: space.xs,
});

export const repliedTo = style({
	paddingBottom: space.xs,
});
