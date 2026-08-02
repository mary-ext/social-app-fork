import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { iconSize } from '#/styles/tokens.css';

export const NOTIF_AVI_SIZE = 32;
export const POST_AVI_SIZE = 36;
export const ICON_SIZE = 24;

export const outer = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			position: 'relative',
			flexDirection: 'row',
			gap: 12,
			alignItems: 'flex-start',
			borderTopWidth: 0,
			borderTopStyle: 'solid',
			borderTopColor: colors.borderContrastLow,
			paddingBlock: 12,
			paddingInline: 16,
			overflow: 'hidden',
			cursor: 'pointer',
			selectors: {
				'&:hover': { backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover) },
			},
		},
		variants: {
			topBorder: { true: { borderTopWidth: 1 } },
			unread: {
				true: {
					borderTopColor: colors.primary_100,
					backgroundColor: colors.primary_25,
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
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-end',
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
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	padding: 0,
	height: NOTIF_AVI_SIZE,
	cursor: 'pointer',
});

export const avatarsRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
});

export const moreCount = style({
	paddingInline: 6,
	fontVariantNumeric: 'proportional-nums',
});

export const authorChevron = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
});

export const expandPanel = style({
	transition: 'height 200ms ease, opacity 200ms ease',
	opacity: 1,
	height: 'var(--collapsible-panel-height)',
	overflow: 'hidden',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			opacity: 0,
			height: 0,
		},
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
});

export const expandContent = style({
	paddingTop: 8,
	paddingBottom: 12,
});

export const expandCardGap = style({
	paddingBottom: 12,
});

export const notifText = style({
	display: 'block',
	paddingTop: 6,
});

// pins the display name to LTR so an RTL name can't reorder the sentence around it. CSS does this without
// injecting U+202A/U+202C into the text, which would otherwise ride along into anything copied out.
export const authorName = style({
	direction: 'ltr',
	unicodeBidi: 'isolate',
});

export const badgeWrap = style({
	display: 'inline-flex',
	position: 'relative',
	top: 2,
	paddingRight: 2,
	paddingLeft: 3,

	':empty': {
		display: 'none',
	},
});

export const followBtnWrap = style({
	display: 'flex',
	alignItems: 'flex-start',
	paddingTop: 8,
});

export const sayHelloBtn = style({
	marginLeft: 'auto',
});

export const additionalWrap = style({
	paddingTop: 2,
});

export const additionalPostEmbed = style({
	marginTop: 5,
	marginLeft: 2,
	opacity: 0.8,
});

export const feedCardWrap = style({
	paddingTop: 6,
});

export const viaStarterPack = style({
	display: 'block',
	paddingTop: 4,
});

export const viaStarterPackIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.primary_500,
	display: 'inline-block',
	position: 'relative',
	top: 2,
	marginRight: 3,
});

export const starterPackBox = style({
	marginTop: 8,
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: 8,
	borderColor: colors.borderContrastLow,
	padding: 8,
});

export const heartIconFilledIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
	color: colors.pink,
});

export const repostIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
	color: colors.positive_500,
});

export const avatarBadgeIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
	color: colors.primary_500,
});

export const starterPackIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
});

export const verifiedCheckIcon = style({
	width: iconSize._2xl,
	height: iconSize._2xl,
});

export const verifiedCheckIcon2 = style({
	width: iconSize._2xl,
	height: iconSize._2xl,
	color: colors.contrast_500,
});

export const repostIcon2 = style({
	width: iconSize._2xl,
	height: iconSize._2xl,
	color: colors.positive_500,
});

export const bellRingingIcon = style({
	width: iconSize._2xl,
	height: iconSize._2xl,
	color: colors.primary_500,
});

export const chevronUpIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.textContrastHigh,
});

export const chevronDownIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.textContrastMedium,
});
