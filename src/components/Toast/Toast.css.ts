import { createVar, style, styleVariants } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { vars } from '#/styles/contract.css';
import { borderRadius, fontSize, fontWeight, lineHeight, zIndex } from '#/styles/tokens.css';

const gap = 8;
const peek = 8;

const scaleVar = createVar();
const shrinkVar = createVar();
const heightVar = createVar();
const offsetYVar = createVar();

const firstLineVar = createVar();

export const viewport = style({
	position: 'fixed',
	top: 'auto',
	right: 'auto',
	bottom: 20,
	left: 20,
	zIndex: zIndex.toast,
	outline: 0,
	width: 'min(380px, calc(100vw - 40px))',
	'@media': {
		'(width < 800px)': { width: 'calc(100vw - 40px)' },
	},
});

export const root = style({
	vars: {
		[scaleVar]: 'calc(max(0, 1 - (var(--toast-index) * 0.08)))',
		[shrinkVar]: `calc(1 - ${scaleVar})`,
		[heightVar]: 'var(--toast-frontmost-height, var(--toast-height))',
		[offsetYVar]: `calc(var(--toast-offset-y) * -1 + (var(--toast-index) * ${-gap}px) + var(--toast-swipe-movement-y))`,
	},
	boxSizing: 'border-box',
	position: 'absolute',
	bottom: 0,
	left: 0,
	transform: `translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-swipe-movement-y) - (var(--toast-index) * ${peek}px) - (${shrinkVar} * ${heightVar}))) scale(${scaleVar})`,
	transformOrigin: 'bottom left',
	transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s, height 0.2s',
	zIndex: 'calc(1000 - var(--toast-index))',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.sm,
	width: 'max-content',
	maxWidth: '100%',
	height: heightVar,
	userSelect: 'none',
	'::after': {
		position: 'absolute',
		top: '100%',
		left: 0,
		width: '100%',
		height: gap + 1,
		content: '""',
	},
	selectors: {
		'&[data-expanded]': {
			transform: `translateX(var(--toast-swipe-movement-x)) translateY(${offsetYVar})`,
			height: 'var(--toast-height)',
		},
		'&[data-starting-style], &[data-ending-style]': {
			transform: 'translateY(110%)',
		},
		'&[data-limited]': { opacity: 0 },
		'&[data-ending-style]': { opacity: 0 },
		'&[data-ending-style][data-swipe-direction="down"]': {
			transform: 'translateY(calc(var(--toast-swipe-movement-y) + 150%))',
		},
		'&[data-ending-style][data-swipe-direction="left"]': {
			transform: `translateX(calc(var(--toast-swipe-movement-x) - 150%)) translateY(${offsetYVar})`,
		},
	},
	'@media': {
		'(width < 800px)': { width: '100%' },
	},
});

const neutral = {
	borderColor: vars.palette.contrast_100,
	backgroundColor: vars.palette.contrast_25,
	color: vars.palette.contrast_1000,
};

export const rootColor = styleVariants({
	default: neutral,
	error: {
		borderColor: vars.palette.negative_200,
		backgroundColor: vars.palette.negative_25,
		color: vars.palette.negative_700,
		selectors: {
			'.theme--dim &': { color: vars.palette.negative_900 },
			'.theme--dark &': { borderColor: vars.palette.negative_100, color: vars.palette.negative_900 },
		},
	},
	info: neutral,
	success: {
		borderColor: vars.palette.primary_300,
		backgroundColor: vars.palette.primary_25,
		color: vars.palette.primary_600,
		selectors: {
			'.theme--dim &': { borderColor: vars.palette.primary_200, color: vars.palette.primary_700 },
			'.theme--dark &': { borderColor: vars.palette.primary_100, color: vars.palette.primary_700 },
		},
	},
	warning: neutral,
});

export const content = style({
	vars: {
		[firstLineVar]: `calc(${fontSize.md} * ${lineHeight.snug})`,
	},
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'start',
	transition: 'opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
	padding: '14px 16px',
	height: '100%',
	overflow: 'hidden',
	selectors: {
		'&[data-behind]': { opacity: 0 },
		'&[data-expanded]': { opacity: 1 },
	},
});

export const icon = style({
	flexShrink: 0,
	marginRight: 8,
	marginBlock: `calc((${firstLineVar} - 20px) / 2)`,
});

export const title = style({
	flex: 1,
	margin: 0,
	minWidth: 0,
	lineHeight: firstLineVar,
	overflowWrap: 'break-word',
	fontSize: fontSize.md,
	fontWeight: fontWeight.medium,
});

export const action = style({
	flexShrink: 0,
	marginRight: -6,
	marginLeft: 8 + 8,
	marginBlock: -4,
	border: 0,
	borderRadius: borderRadius.sm,
	backgroundColor: colorMix('currentColor', '12%'),
	padding: '4px 8px',
	lineHeight: firstLineVar,
	color: 'inherit',
	fontFamily: 'inherit',
	fontSize: fontSize.md_sub,
	fontWeight: fontWeight.semiBold,
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: colorMix('currentColor', '20%') },
	},
});
