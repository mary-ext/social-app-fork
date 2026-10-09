import { createVar, style, styleVariants } from '@vanilla-extract/css';

import * as toastVars from '#/components/primitives/toast/css-vars';

import { vars } from '#/styles/contract.css';
import { withAlpha } from '#/styles/functions';
import { hover } from '#/styles/interaction';
import { borderRadius, fontSize, fontWeight, iconSize, lineHeight } from '#/styles/tokens.css';

const gap = 8;
const peek = 8;

const scaleVar = createVar();
const shrinkVar = createVar();
const heightVar = createVar();
const offsetYVar = createVar();

const firstLineVar = createVar();

// reset browser popover styles.
export const viewport = style({
	position: 'fixed',
	inset: 'auto auto 20px 20px',
	margin: 0,
	outline: 0,
	border: 0,
	backgroundColor: 'transparent',
	padding: 0,
	width: 'min(380px, calc(100vw - 40px))',
	height: 0,
	overflow: 'visible',
	color: 'inherit',
	'@media': {
		'(width < 800px)': { width: 'calc(100vw - 40px)' },
	},
});

const swipeX = `var(${toastVars.swipeMovementX}, 0px)`;
const swipeY = `var(${toastVars.swipeMovementY}, 0px)`;
const index = `var(${toastVars.index})`;
const height = `var(${toastVars.height})`;

// separate swipe translation from stacking so dragging can skip transitions without interrupting the stack.
export const root = style({
	vars: {
		[scaleVar]: `calc(max(0, 1 - (${index} * 0.08)))`,
		[shrinkVar]: `calc(1 - ${scaleVar})`,
		[heightVar]: `var(${toastVars.frontmostHeight}, ${height})`,
		[offsetYVar]: `calc(var(${toastVars.offsetY}) * -1 + (${index} * ${-gap}px))`,
	},
	boxSizing: 'border-box',
	position: 'absolute',
	bottom: 0,
	left: 0,
	translate: `${swipeX} ${swipeY}`,
	transform: `translateY(calc((${index} * ${-peek}px) - (${shrinkVar} * ${heightVar}))) scale(${scaleVar})`,
	transformOrigin: 'bottom left',
	transitionDuration: '0.4s, 0.4s, 0.4s, 0.2s',
	transitionProperty: 'translate, transform, opacity, height',
	transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1), ease, ease',
	zIndex: `calc(1000 - ${index})`,
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
			transform: `translateY(${offsetYVar})`,
			height,
		},
		'&[data-swiping]': {
			transitionDuration: '0s, 0.4s, 0.4s, 0.2s',
		},
		'&[data-limited], &[data-closed]': { opacity: 0 },
		'&[data-closed]:not([data-swipe-direction])': {
			transform: 'translateY(110%)',
		},
		'&[data-closed][data-swipe-direction="down"]': {
			translate: `0 calc(${swipeY} + 150%)`,
		},
		'&[data-closed][data-swipe-direction="left"]': {
			translate: `calc(${swipeX} - 150%) 0`,
		},
		'&[data-closed][data-swipe-direction="right"]': {
			translate: `calc(${swipeX} + 150%) 0`,
		},
	},
	'@starting-style': {
		translate: '0 110%',
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
	width: iconSize.lg,
	height: iconSize.lg,
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
	backgroundColor: withAlpha('currentColor', '12%'),
	padding: '4px 8px',
	lineHeight: firstLineVar,
	color: 'inherit',
	fontFamily: 'inherit',
	fontSize: fontSize.md_sub,
	fontWeight: fontWeight.semiBold,
	cursor: 'pointer',
	selectors: {
		[hover()]: { backgroundColor: withAlpha('currentColor', '20%') },
	},
});
