import { globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

// width of the avatar column, which the footer indents past to line up with text.
const AVATAR_COLUMN = 48;

// row background lives here so highlight covers interactive siblings (menu, footer) too.
export const root = style({
	backgroundColor: colors.contrast_0,
	position: 'relative',
	selectors: {
		'&:has(a:active)': { backgroundColor: colors.contrast_25 },
		'&:has(a:focus-visible)': { backgroundColor: colors.contrast_25 },
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

// mutually exclusive background states; selected preserves highlight on hover.
export const tone = styleVariants({
	default: {},
	selected: {
		backgroundColor: colors.contrast_50,
		selectors: {
			'&:has(a:active)': { backgroundColor: colors.contrast_50 },
			'&:has(a:focus-visible)': { backgroundColor: colors.contrast_50 },
			'&:hover': { backgroundColor: colors.contrast_50 },
		},
	},
	unread: { backgroundColor: colors.primary_25 },
});

// absolute link overlay covers the whole row. z-index layers ensure the link captures clicks except on interactive siblings.
export const link = style({ inset: 0, position: 'absolute', zIndex: 1 });

export const body = style({
	display: 'flex',
	gap: space.md,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	justifyContent: 'center',
	minWidth: 0,
	paddingRight: 33,
});

export const titleRow = style({
	alignItems: 'center',
	display: 'flex',
});

export const badges = style({
	paddingLeft: 6,

	':empty': {
		display: 'none',
	},
});

export const timestamp = style({
	paddingLeft: space.sm,
	whiteSpace: 'nowrap',
});

export const mutedIcon = style({
	flexShrink: 0,
	marginLeft: space.sm,
});

export const unreadDot = recipe(
	{
		base: {
			backgroundColor: colors.primary_500,
			borderRadius: borderRadius.full,
			flexShrink: 0,
			height: 8,
			marginLeft: 6,
			width: 8,
		},
		variants: {
			dim: { true: { backgroundColor: colors.contrast_200 } },
		},
	},
	{ debugId: 'unreadDot' },
);

export const requestInfo = style({ paddingBottom: space._2xs });

export const lastMessageRow = style({ alignItems: 'center', display: 'flex' });

export const lastMessageIcon = style({ flexShrink: 0, marginRight: 2 });

// clip overflow to prevent alerts from widening the row.
export const postAlerts = style({
	overflow: 'hidden',
	paddingBottom: space._2xs,
});

// menu reveals on hover/focus, and is always visible on touch viewports or when open.
export const menu = style({
	'@media': {
		'(width < 800px)': { opacity: 1 },
	},
	alignItems: 'center',
	bottom: 0,
	display: 'flex',
	opacity: 0,
	// pointer events fall through to the link overlay.
	position: 'absolute',
	right: space.lg,
	selectors: {
		'&:has([data-popup-open])': { opacity: 1 },
		[`${root}:focus-within &`]: { opacity: 1 },
		[`${root}:hover &`]: { opacity: 1 },
	},
	top: 0,
	zIndex: 2,
});

globalStyle(`${menu} > *`, { pointerEvents: 'auto' });

// action bar outside the link to avoid nesting buttons in anchors, stacked above overlay.
export const footer = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.sm,
	paddingBottom: space.md,
	paddingLeft: space.lg + AVATAR_COLUMN + space.md,
	paddingRight: space.md,
	// pointer events fall through to the link overlay.
	pointerEvents: 'none',
	position: 'relative',
	zIndex: 2,
});

globalStyle(`${footer} > *`, { pointerEvents: 'auto' });
