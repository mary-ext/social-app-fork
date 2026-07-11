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
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
				},
			},
		},
	},
	{ debugId: 'section' },
);

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	paddingInline: space.lg,
	paddingTop: space.md,
});

export const seeMoreTrigger = style({
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	font: 'inherit',
	padding: 0,
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
	overflowX: 'auto',
	padding: space.lg,
	paddingTop: space.md,
	scrollPaddingInline: space.lg,
	scrollSnapType: 'x mandatory',
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
	backgroundColor: colors.bg,
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.lg,
	borderStyle: 'solid',
	borderWidth: 1,
	boxShadow: vars.shadow.sm,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: space.xs,
	minWidth: 0,
	padding: space.md,
	position: 'relative',
	scrollSnapAlign: 'start',
	width: MOBILE_CARD_WIDTH,
	'@media': {
		[WIDE]: {
			flexBasis: `calc(30% - ${GRID_GAP / 2}px)`,
			flexGrow: 1,
			width: 'auto',
		},
	},
});

export const cardLink = style({
	color: 'inherit',
	cursor: 'pointer',
	textDecoration: 'none',
	selectors: {
		'&:hover, &:active': { borderColor: colors.borderContrastHigh },
	},
});

export const dismiss = style({
	alignItems: 'center',
	background: 'none',
	border: 'none',
	color: colors.textContrastMedium,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xs,
	position: 'absolute',
	right: space.sm,
	top: space.sm,
	zIndex: 1,
	selectors: {
		'&:hover': { color: colors.text },
	},
});

export const body = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	marginBottom: 'auto',
	paddingBottom: space.sm,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
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
	alignItems: 'center',
	alignSelf: 'stretch',
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

export const description = style({
	width: '100%',
});

export const followPlaceholder = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.sm,
	height: 33,
	width: '100%',
});

export const seeMoreCard = style({
	alignItems: 'center',
	background: 'none',
	border: 'none',
	color: colors.text,
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: space.sm,
	justifyContent: 'center',
	padding: space.md,
	scrollSnapAlign: 'start',
	width: FINAL_CARD_WIDTH,
	'@media': {
		[WIDE]: { display: 'none' },
	},
});
