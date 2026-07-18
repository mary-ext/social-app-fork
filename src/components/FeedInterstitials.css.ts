import { globalStyle, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

const MOBILE_CARD_WIDTH = 165;
const FINAL_CARD_WIDTH = 120;
const GRID_GAP = space.md;
const WIDE = 'screen and (min-width: 800px)';

export const section = recipe(
	{
		base: {
			backgroundColor: colors.contrast_25,
		},
		defaultVariants: { topBorder: true },
		variants: {
			topBorder: {
				true: {
					borderTopWidth: 1,
					borderTopStyle: 'solid',
					borderTopColor: colors.borderContrastLow,
				},
			},
		},
	},
	{ debugId: 'section' },
);

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingTop: space.md,
	paddingInline: space.lg,
});

export const seeMoreTrigger = style({
	border: 'none',
	background: 'none',
	padding: 0,
	font: 'inherit',
	cursor: 'pointer',
});

export const seeMoreText = style({
	selectors: {
		[`${seeMoreTrigger}:hover &`]: { textDecoration: 'underline' },
	},
});

export const grid = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: GRID_GAP,
	padding: space.lg,
	paddingTop: space.md,
	overflowX: 'auto',
	scrollSnapType: 'x mandatory',
	scrollPaddingInline: space.lg,
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
	'@media': {
		[WIDE]: {
			flexWrap: 'wrap',
			overflowX: 'visible',
			scrollSnapType: 'none',
		},
	},
});

globalStyle(`${grid} > *:nth-child(n+4)`, {
	'@media': {
		[WIDE]: { display: 'none' },
	},
});

export const cardBase = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	flexShrink: 0,
	gap: space.xs,
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.lg,
	borderColor: colors.borderContrastLow,
	boxShadow: vars.shadow.sm,
	backgroundColor: colors.bg,
	padding: space.md,
	width: MOBILE_CARD_WIDTH,
	minWidth: 0,
	scrollSnapAlign: 'start',
	'@media': {
		[WIDE]: {
			flexBasis: `calc(30% - ${GRID_GAP / 2}px)`,
			flexGrow: 1,
			width: 'auto',
		},
	},
});

export const cardLink = style({
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover, &:active': { borderColor: colors.borderContrastHigh },
	},
});

export const dismiss = style({
	display: 'flex',
	position: 'absolute',
	top: space.sm,
	right: space.sm,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 1,
	border: 'none',
	background: 'none',
	padding: space.xs,
	color: colors.textContrastMedium,
	cursor: 'pointer',
	selectors: {
		'&:hover': { color: colors.text },
	},
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	alignItems: 'center',
	marginBottom: 'auto',
	paddingBottom: space.sm,
});

export const nameRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	maxWidth: '100%',
});

export const badges = style({
	flexShrink: 0,
	paddingLeft: space.xs,

	':empty': {
		display: 'none',
	},
});

export const identity = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	alignItems: 'center',
	alignSelf: 'stretch',
});

export const description = style({
	width: '100%',
});

export const followPlaceholder = style({
	borderRadius: borderRadius.sm,
	backgroundColor: vars.palette.contrast_50,
	width: '100%',
	height: 33,
});

export const seeMoreCard = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'center',
	border: 'none',
	background: 'none',
	padding: space.md,
	width: FINAL_CARD_WIDTH,
	scrollSnapAlign: 'start',
	color: colors.text,
	cursor: 'pointer',
	'@media': {
		[WIDE]: { display: 'none' },
	},
});
