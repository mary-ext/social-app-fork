import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

export const NOTIF_AVI_SIZE = 32;
export const POST_AVI_SIZE = 36;
export const ICON_SIZE = 24;

export const outer = recipe(
	{
		base: {
			alignItems: 'flex-start',
			borderTopColor: colors.borderContrastLow,
			borderTopStyle: 'solid',
			borderTopWidth: 0,
			boxSizing: 'border-box',
			cursor: 'pointer',
			display: 'flex',
			flexDirection: 'row',
			overflow: 'hidden',
			gap: 12,
			paddingBlock: 12,
			paddingInline: 16,
			position: 'relative',
			selectors: {
				'&:hover': { backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover) },
			},
		},
		variants: {
			topBorder: { true: { borderTopWidth: 1 } },
			unread: {
				true: {
					backgroundColor: colors.primary_25,
					borderTopColor: colors.primary_100,
					selectors: {
						'&:hover': { backgroundColor: colors.primary_50 },
					},
				},
			},
		},
	},
	{ debugId: 'outer' },
);

export const iconColumn = style({
	alignItems: 'flex-end',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	padding: (NOTIF_AVI_SIZE - ICON_SIZE) / 2,
	width: POST_AVI_SIZE,
});

export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const authorsTrigger = style({
	alignItems: 'center',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	height: NOTIF_AVI_SIZE,
	padding: 0,
});

export const avatarsRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
});

export const moreCount = style({
	fontVariantNumeric: 'proportional-nums',
	paddingInline: 6,
});

export const authorChevron = style({
	display: 'flex',
	alignItems: 'center',
	flexShrink: 0,
});

export const expandPanel = style({
	height: 'var(--collapsible-panel-height)',
	opacity: 1,
	overflow: 'hidden',
	transition: 'height 200ms ease, opacity 200ms ease',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			height: 0,
			opacity: 0,
		},
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
});

export const expandContent = style({
	paddingBottom: 12,
	paddingTop: 8,
});

export const expandCardGap = style({
	paddingBottom: 12,
});

export const notifText = style({
	display: 'block',
	paddingTop: 6,
});

export const badgeWrap = style({
	display: 'inline-flex',
	paddingLeft: 3,
	paddingRight: 2,
	position: 'relative',
	top: 2,

	':empty': {
		display: 'none',
	},
});

export const followBtnWrap = style({
	alignItems: 'flex-start',
	display: 'flex',
	paddingTop: 8,
});

export const sayHelloBtn = style({
	marginLeft: 'auto',
});

export const additionalWrap = style({
	paddingTop: 2,
});

export const feedCardWrap = style({
	paddingTop: 6,
});

export const starterPackBox = style({
	borderColor: colors.borderContrastLow,
	borderRadius: 8,
	borderStyle: 'solid',
	borderWidth: 1,
	marginTop: 8,
	padding: 8,
});
