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
	bottom: 20,
	left: 20,
	outline: 0,
	position: 'fixed',
	right: 'auto',
	top: 'auto',
	width: 'min(380px, calc(100vw - 40px))',
	zIndex: zIndex.toast,
	'@media': {
		'(width < 800px)': { width: 'calc(100vw - 40px)' },
	},
});

export const root = style({
	borderRadius: borderRadius.md,
	borderStyle: 'solid',
	borderWidth: 1,
	bottom: 0,
	boxShadow: vars.shadow.sm,
	boxSizing: 'border-box',
	height: heightVar,
	left: 0,
	maxWidth: '100%',
	position: 'absolute',
	transformOrigin: 'bottom left',
	transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s, height 0.2s',
	userSelect: 'none',
	vars: {
		[scaleVar]: 'calc(max(0, 1 - (var(--toast-index) * 0.08)))',
		[shrinkVar]: `calc(1 - ${scaleVar})`,
		[heightVar]: 'var(--toast-frontmost-height, var(--toast-height))',
		[offsetYVar]: `calc(var(--toast-offset-y) * -1 + (var(--toast-index) * ${-gap}px) + var(--toast-swipe-movement-y))`,
	},
	width: 'max-content',
	'@media': {
		'(width < 800px)': { width: '100%' },
	},
	zIndex: 'calc(1000 - var(--toast-index))',
	transform: `translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-swipe-movement-y) - (var(--toast-index) * ${peek}px) - (${shrinkVar} * ${heightVar}))) scale(${scaleVar})`,
	'::after': {
		content: '""',
		height: gap + 1,
		left: 0,
		position: 'absolute',
		top: '100%',
		width: '100%',
	},
	selectors: {
		'&[data-expanded]': {
			height: 'var(--toast-height)',
			transform: `translateX(var(--toast-swipe-movement-x)) translateY(${offsetYVar})`,
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
});

const neutral = {
	backgroundColor: vars.palette.contrast_25,
	borderColor: vars.palette.contrast_100,
	color: vars.palette.contrast_1000,
};

export const rootColor = styleVariants({
	default: neutral,
	error: {
		backgroundColor: vars.palette.negative_25,
		borderColor: vars.palette.negative_200,
		color: vars.palette.negative_700,
		selectors: {
			'.theme--dim &': { color: vars.palette.negative_900 },
			'.theme--dark &': { borderColor: vars.palette.negative_100, color: vars.palette.negative_900 },
		},
	},
	info: neutral,
	success: {
		backgroundColor: vars.palette.primary_25,
		borderColor: vars.palette.primary_300,
		color: vars.palette.primary_600,
		selectors: {
			'.theme--dim &': { borderColor: vars.palette.primary_200, color: vars.palette.primary_700 },
			'.theme--dark &': { borderColor: vars.palette.primary_100, color: vars.palette.primary_700 },
		},
	},
	warning: neutral,
});

export const content = style({
	alignItems: 'start',
	boxSizing: 'border-box',
	display: 'flex',
	height: '100%',
	overflow: 'hidden',
	padding: '14px 16px',
	transition: 'opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
	vars: {
		[firstLineVar]: `calc(${fontSize.md} * ${lineHeight.snug})`,
	},
	selectors: {
		'&[data-behind]': { opacity: 0 },
		'&[data-expanded]': { opacity: 1 },
	},
});

export const icon = style({
	flexShrink: 0,
	marginBlock: `calc((${firstLineVar} - 20px) / 2)`,
	marginRight: 8,
});

export const title = style({
	flex: 1,
	fontSize: fontSize.md,
	fontWeight: fontWeight.medium,
	lineHeight: firstLineVar,
	margin: 0,
	minWidth: 0,
	overflowWrap: 'break-word',
});

export const action = style({
	backgroundColor: colorMix('currentColor', '12%'),
	border: 0,
	borderRadius: borderRadius.sm,
	color: 'inherit',
	cursor: 'pointer',
	flexShrink: 0,
	fontFamily: 'inherit',
	fontSize: fontSize.md_sub,
	fontWeight: fontWeight.semiBold,
	lineHeight: firstLineVar,
	marginBlock: -4,
	marginRight: -6,
	marginLeft: 8 + 8,
	padding: '4px 8px',
	selectors: {
		'&:hover': { backgroundColor: colorMix('currentColor', '20%') },
	},
});
