import { style } from '@vanilla-extract/css';

/**
 * The post action bar: the reply/repost/like cluster pinned to the leading edge, the bookmark/share/overflow
 * cluster trailing.
 */
export const outer = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	justifyContent: 'space-between',
});

/** Non-`big` rows add a hair of top padding; the `big` thread-anchor bar sits flush. */
export const outerPad = style({
	paddingTop: 2,
});

/** Holds the three primary controls and caps their spread so wide rows don't fling them apart. */
export const primaryGroup = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	maxWidth: 320,
});

/** One of the three equal-width primary slots, its button pinned to the leading edge. */
export const primaryItem = style({
	alignItems: 'flex-start',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
});

/** Pulls the reply button's ghost padding back flush to the row edge. */
export const replyOffset = style({ marginLeft: -6 });
export const replyOffsetBig = style({ marginLeft: -2 });

/** Dims the reply slot when the viewer can't reply. */
export const replyDisabled = style({ opacity: 0.6 });

/** The trailing bookmark/share/overflow cluster. */
export const secondaryGroup = style({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
});
