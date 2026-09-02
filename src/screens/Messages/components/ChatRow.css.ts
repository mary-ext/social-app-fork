import { createVar, globalStyle, style, styleVariants } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { MOUSE, PRESSED, TOUCH } from '#/styles/interaction';
import { recipe } from '#/styles/recipe';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

const AVATAR_COLUMN = 48;

export const rowBg = createVar();

export const root = style({
	vars: { [rowBg]: colors.contrast_0 },
	position: 'relative',
	backgroundColor: rowBg,
	selectors: {
		[`&:has(a${PRESSED}), &:has(a:focus-visible), ${MOUSE} &:hover`]: {
			vars: {
				[rowBg]: colors.contrast_25,
			},
		},
	},
});

export const tone = styleVariants({
	default: {},
	selected: {
		vars: {
			[rowBg]: colors.contrast_50,
		},
		selectors: {
			[`&:has(a${PRESSED}), &:has(a:focus-visible), ${MOUSE} &:hover`]: {
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

export const link = style({
	position: 'absolute',
	inset: 0,
	zIndex: 1,
	':focus-visible': {
		outline: `2px solid ${colors.primary_500}`,
		outlineOffset: -2,
	},
});

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

	selectors: {
		[`${TOUCH} &`]: {
			paddingRight: 25 + space.md,
		},
	},
	'@media': {
		'(width < 800px)': {
			paddingRight: 25 + space.md,
		},
	},
});

export const titleRow = style({
	display: 'flex',
	alignItems: 'center',
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
	width: iconSize.xs,
	height: iconSize.xs,
	color: colors.textContrastMedium,
	flexShrink: 0,
	marginLeft: space.sm,
});

export const unreadDot = recipe(
	{
		base: {
			flexShrink: 0,
			marginLeft: 6,
			borderRadius: borderRadius.full,
			backgroundColor: colors.primary_500,
			width: 8,
			height: 8,
		},
		variants: {
			dim: { true: { backgroundColor: colors.contrast_200 } },
		},
	},
	{ debugId: 'unreadDot' },
);

export const requestInfo = style({ paddingBottom: space._2xs });

export const lastMessageRow = style({ display: 'flex', alignItems: 'center' });

export const lastMessageIcon = style({
	flexShrink: 0,
	marginRight: 2,
	width: iconSize.xs,
	height: iconSize.xs,
	color: colors.contrast_700,
});

export const lastMessageIconUnread = style({ color: colors.contrast_900 });

export const postAlerts = style({
	paddingBottom: space._2xs,
	overflow: 'hidden',
});

export const menu = style({
	display: 'flex',
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	alignItems: 'center',
	transition: 'opacity 150ms ease',
	opacity: 0,
	zIndex: 2,
	paddingRight: space.lg,
	paddingLeft: space._4xl,
	pointerEvents: 'none',

	selectors: {
		'&:has([data-popup-open], :focus-visible)': {
			transition: 'none',
			opacity: 1,
		},
		[`${MOUSE} ${root}:hover &`]: {
			opacity: 1,
		},
		[`${TOUCH} &`]: {
			opacity: 1,
		},
	},

	'@media': {
		'(width >= 800px)': {
			background: `linear-gradient(to left, ${rowBg}, ${rowBg} 50%, transparent)`,
		},
		'(width < 800px)': {
			opacity: 1,
		},
	},
});

globalStyle(`${menu} > *`, { pointerEvents: 'auto' });

export const menuIcon = style({
	marginRight: -8,
});

export const footer = style({
	display: 'flex',
	position: 'relative',
	gap: space.sm,
	alignItems: 'center',
	zIndex: 2,
	paddingRight: space.md,
	paddingBottom: space.md,
	paddingLeft: space.lg + AVATAR_COLUMN + space.md,
	pointerEvents: 'none',
});

globalStyle(`${footer} > *`, { pointerEvents: 'auto' });
