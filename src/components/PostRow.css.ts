import { style } from '@vanilla-extract/css';

/**
 * The avatar + content columns side by side. `gap` owns the avatar→content spacing for both the feed and
 * standalone surfaces.
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
});

/**
 * The flex-1 content column. `minWidth: 0` lets long names/text ellipsize instead of overflowing the row
 * (plain CSS flex items default to `min-width: auto`).
 */
export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

/**
 * Below-row rhythm for the spacing-free `PostMeta` leaf (the parent owns the spacing). `display: flex` so the
 * wrapper hugs the row instead of inflating it with the font strut.
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
