import { createVar, fallbackVar, keyframes, style } from '@vanilla-extract/css';

import { borderRadius, iconSize, space, zIndex } from '#/styles/tokens.css';

export const panelHeightVar = createVar();

export const portal = style({ zIndex: zIndex.popover });

export const popup = style({
	boxSizing: 'border-box',
	transformOrigin: 'var(--transform-origin)',
	overflow: 'hidden',
	outline: 0,
	borderRadius: borderRadius.sm,
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	backdropFilter: 'blur(12px)',
	padding: space.xs,
	width: 264,
	maxWidth: 'var(--available-width)',
	transition: 'opacity 0.15s ease, scale 0.15s ease',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { scale: '0.95', opacity: 0 },
	},
});

export const srOnly = style({
	position: 'absolute',
	transform: 'scale(0)',
});

export const viewport = style({
	overflowX: 'hidden',
	overflowY: 'auto',
	height: fallbackVar(panelHeightVar, 'auto'),
	maxHeight: 'var(--available-height)',
	transition: 'height 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
	selectors: {
		'&[data-transitioning]': { overflowY: 'hidden' },
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': { transition: 'none' },
	},
});

const slideForward = keyframes({
	from: { translate: '25% 0', opacity: 0 },
	to: { translate: '0 0', opacity: 1 },
});

const slideBack = keyframes({
	from: { translate: '-25% 0', opacity: 0 },
	to: { translate: '0 0', opacity: 1 },
});

export const panel = style({
	outline: 0,
	selectors: {
		'&[data-direction="forward"]': { animation: `${slideForward} 0.18s ease-out` },
		'&[data-direction="back"]': { animation: `${slideBack} 0.18s ease-out` },
	},
	'@media': {
		// match the default selector specificity.
		'(prefers-reduced-motion: reduce)': {
			selectors: {
				'&[data-direction="forward"], &[data-direction="back"]': { animation: 'none' },
			},
		},
	},
});

export const row = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.lg,
	alignItems: 'center',
	margin: 0,
	outline: 0,
	border: 0,
	borderRadius: borderRadius.xs,
	background: 'transparent',
	paddingBlock: space.sm,
	paddingInline: 10,
	width: '100%',
	minHeight: 32,
	textAlign: 'start',
	color: '#fff',
	cursor: 'pointer',
	userSelect: 'none',
	selectors: {
		'&:focus': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
	},
});

export const rowIcon = style({
	flexShrink: 0,
	marginLeft: -2,
	width: iconSize.lg,
	height: iconSize.lg,
	color: 'rgba(255, 255, 255, 0.85)',
});

export const rowLabel = style({
	flex: 1,
});

export const rowValue = style({
	flexShrink: 0,
	maxWidth: '45%',
	color: 'rgba(255, 255, 255, 0.65)',
});

export const rowChevron = style({
	flexShrink: 0,
	marginRight: -2,
	width: iconSize.lg,
	height: iconSize.lg,
	color: 'rgba(255, 255, 255, 0.65)',
});

export const rowSpinner = style({
	flexShrink: 0,
	marginRight: -2,
});

export const rowRadio = style({
	boxSizing: 'border-box',
	display: 'inline-flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	border: '1px solid rgba(255, 255, 255, 0.4)',
	borderRadius: borderRadius.full,
	width: 20,
	height: 20,
});

export const rowRadioDot = style({
	borderRadius: borderRadius.full,
	backgroundColor: '#fff',
	width: 14,
	height: 14,
});

export const separator = style({
	flexShrink: 0,
	marginBlock: space.xs,
	border: 0,
	backgroundColor: 'rgba(255, 255, 255, 0.15)',
	height: 1,
});
