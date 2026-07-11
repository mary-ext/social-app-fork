import { createVar, globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

// width of the avatar column, which the footer indents past to line up with text.
const AVATAR_COLUMN = 48;

// current row background, exposed as a variable so descendants (menu) can fade into it.
export const rowBg = createVar();

// row background lives here so highlight covers interactive siblings (menu, footer) too.
export const root = style({
	vars: { [rowBg]: colors.contrast_0 },
	backgroundColor: rowBg,
	position: 'relative',
	selectors: {
		'&:has(a:active)': {
			vars: {
				[rowBg]: colors.contrast_25,
			},
		},
		'&:has(a:focus-visible)': {
			vars: {
				[rowBg]: colors.contrast_25,
			},
		},
		'&:hover': {
			vars: {
				[rowBg]: colors.contrast_25,
			},
		},
	},
});

// mutually exclusive background states; selected preserves highlight on hover.
export const tone = styleVariants({
	default: {},
	selected: {
		vars: {
			[rowBg]: colors.contrast_50,
		},
		selectors: {
			'&:has(a:active)': {
				vars: {
					[rowBg]: colors.contrast_50,
				},
			},
			'&:has(a:focus-visible)': {
				vars: {
					[rowBg]: colors.contrast_50,
				},
			},
			'&:hover': {
				vars: {
					[rowBg]: colors.contrast_50,
				},
			},
		},
	},
	unread: {
		vars: {
			[rowBg]: colors.primary_25,
		},
	},
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

	'@media': {
		'(width < 800px)': {
			paddingRight: 25 + space.md,
		},
	},
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

export const menu = style({
	alignItems: 'center',
	display: 'flex',
	opacity: 0,
	paddingLeft: space._4xl,
	paddingRight: space.lg,
	pointerEvents: 'none',
	position: 'absolute',
	top: 0,
	bottom: 0,
	right: 0,
	zIndex: 2,

	'@media': {
		'(width >= 800px)': {
			background: `linear-gradient(to left, ${rowBg}, ${rowBg} 50%, transparent)`,
		},
		'(width < 800px)': {
			opacity: 1,
		},
	},

	selectors: {
		'&:has([data-popup-open])': { opacity: 1 },
		[`${root}:focus-within &`]: { opacity: 1 },
		[`${root}:hover &`]: { opacity: 1 },
	},
});

globalStyle(`${menu} > *`, { pointerEvents: 'auto' });

export const menuIcon = style({
	marginRight: -8,
});

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
