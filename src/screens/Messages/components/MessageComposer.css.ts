import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

const MIN_HEIGHT = 40;

export const container = style({
	boxSizing: 'border-box',
	width: `calc(100% - ${space.sm}px)`,
	paddingTop: space.xs,
	paddingRight: space.sm,
	paddingBottom: space.lg,
	paddingLeft: space.lg,
	backgroundImage: `linear-gradient(to bottom, transparent, color-mix(in srgb, ${colors.bg} 80%, transparent) 80%, ${colors.bg})`,
});

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-end',
	gap: space.sm,
	width: '100%',
});

export const inputBox = style({
	position: 'relative',
	flex: 1,
	minHeight: MIN_HEIGHT,
	borderRadius: borderRadius.xl,
	background: colors.contrast_50,
});

export const inputInner = style({
	// anchors the absolutely-positioned emoji button to the input row, not the whole box (which also
	// holds the staged reply/embed preview above it).
	position: 'relative',
	flex: 1,
});

export const submit = recipe({
	base: {
		appearance: 'none',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: MIN_HEIGHT,
		height: MIN_HEIGHT,
		border: 'none',
		borderRadius: borderRadius.full,
	},
	variants: {
		disabled: {
			true: { background: colors.contrast_100, cursor: 'default' },
			false: { background: colors.primary_500, cursor: 'pointer' },
		},
	},
});

export const emojiButton = style({
	appearance: 'none',
	display: 'inline-flex',
	position: 'absolute',
	top: 10,
	right: 10,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 30,
	border: 'none',
	borderRadius: 999,
	background: 'transparent',
	padding: 0,
	width: 20,
	height: 20,
	color: vars.palette.contrast_900,
	cursor: 'pointer',
	selectors: {
		'&:hover': { color: vars.palette.primary_500 },
		'&:focus-visible': { color: vars.palette.primary_500 },
		'&[data-popup-open]': { color: vars.palette.primary_500 },
	},
});

export const editor = style({
	flex: 1,
});

export const sendIcon = style({
	marginBottom: 2,
});
