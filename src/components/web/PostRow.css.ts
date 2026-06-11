import { style } from '@vanilla-extract/css';

/**
 * The avatar + content columns side by side. `gap` owns the avatar→content spacing for both the feed and
 * standalone surfaces (the feed previously baked it into the avatar column's `paddingRight` instead — same
 * 10px net).
 */
export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	// the feed anchors an absolutely-positioned DiscoverDebug overlay to this row
	position: 'relative',
});

/** The avatar column; also holds the feed's thread reply-spine. */
export const avatarColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingLeft: 8,
});

/**
 * The flex-1 content column. `minWidth: 0` (which RNW flex nodes defaulted to, plain CSS flex items don't)
 * lets long names/text ellipsize instead of overflowing the row.
 */
export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

/**
 * Below-row rhythm for the spacing-free `PostMeta` leaf (the parent owns the spacing). `display: flex` (as
 * the RNW `View` it replaced was) so the wrapper hugs the row instead of inflating it with the font strut.
 */
export const metaSpacing = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: 4,
});

/** Below-row rhythm for `PostRepliedTo`. */
export const repliedTo = style({
	paddingBottom: 4,
});
