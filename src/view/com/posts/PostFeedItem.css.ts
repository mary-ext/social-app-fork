import { style } from '@vanilla-extract/css';

/** The repost/pin reason header row above the post; aligns the reason text with the post body. */
export const reasonRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	paddingLeft: 8,
});

/** Fixed-width slot above the avatar that carries the thread reply-spine up to the parent. */
export const spineSlot = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	width: 42,
});

/** The reason content beside the spine slot. */
export const reason = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 1,
	minWidth: 0,
	paddingTop: 8,
});

/** The thread reply-spine: a 2px vertical bar centered in the avatar column. */
export const replyLine = style({
	flexGrow: 1,
	marginLeft: 'auto',
	marginRight: 'auto',
	width: 2,
});

/** Extra gap below the spine segment that sits above the avatar (in the reason row). */
export const replyLineTop = style({
	marginBottom: 4,
});

/** The feed's 1px nudge between the reason row and the avatar/content row. */
export const layoutRow = style({
	marginTop: 1,
});

/** The feed surface's trailing space below the embed, before the controls. */
export const embedSpacing = style({
	paddingBottom: 4,
});
