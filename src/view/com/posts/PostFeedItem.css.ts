import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

/**
 * Feed-specific layout. The shared row / column / spine / frame structure lives in `#/components/PostLayout`;
 * what remains here is the repost/pin reason header and the feed's per-element body rhythm.
 */

/** The repost/pin reason header row above the post; its leading slot aligns the reason with the post body. */
export const reasonRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

/** Fixed-width slot above the avatar that carries the incoming reply-spine and aligns the reason text. */
export const spineSlot = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	width: 36,
});

/** The reason content beside the spine slot. */
export const reason = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 1,
	minWidth: 0,
	paddingTop: 10,
	paddingBottom: 2,
});

/** Gap below the reason-row spine segment that sits above the avatar. */
export const replyLineTop = style({
	marginBottom: space.xs,
});

/** Top margin on the outgoing spine below the avatar. */
export const replyLineParent = style({
	marginTop: space.xs,
});

/** Same, nudged down when a live-status ring enlarges the avatar's footprint. */
export const replyLineParentLive = style({
	marginTop: space.sm,
});

/** The 1px nudge between the reason row and the avatar/content row. */
export const layoutRow = style({
	marginTop: 1,
});

/**
 * Below-meta rhythm for the spacing-free `PostMeta` leaf (the parent owns the spacing). `display: flex` so
 * the wrapper hugs the row instead of inflating it with the font strut.
 */
export const metaSpacing = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: space.xs,
});

/** Below-row rhythm for `PostRepliedTo`. */
export const repliedTo = style({
	paddingBottom: space.xs,
});
