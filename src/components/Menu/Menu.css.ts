import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize, zIndex } from '#/styles/tokens.css';

export const iconColor = createVar();

export const minWidthVar = createVar();

export const maxWidthVar = createVar();

export const portal = style({
	zIndex: zIndex.popover,
});

export const popup = style({
	boxSizing: 'border-box',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	outline: 0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxShadow: vars.shadow.md,
	backgroundColor: vars.palette.contrast_25,
	padding: 4,
	minWidth: fallbackVar(minWidthVar, 'auto'),
	maxWidth: 'min(var(--available-width), 320px)',
	maxHeight: 'var(--available-height)',
	overflowY: 'auto',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.95)', opacity: 0 },
	},
});

export const item = style({
	vars: { [iconColor]: vars.palette.contrast_700 },
	boxSizing: 'border-box',
	display: 'flex',
	gap: 16,
	alignItems: 'center',
	outline: 0,
	borderRadius: 4,
	paddingBlock: 8,
	paddingInline: 10,
	minHeight: 32,
	textDecoration: 'none',
	lineHeight: 1,
	color: vars.palette.contrast_900,
	fontSize: fontSize.sm,
	fontWeight: 600,
	cursor: 'pointer',
	userSelect: 'none',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_50 },
		'&[data-disabled]': {
			vars: { [iconColor]: vars.palette.contrast_400 },
			color: vars.palette.contrast_400,
			cursor: 'default',
		},
	},
});

export const itemDestructive = style({
	vars: { [iconColor]: vars.palette.negative_500 },
	color: vars.palette.negative_500,
});

export const itemText = style({
	flex: 1,
});

export const itemIcon = style({
	flexShrink: 0,
	marginLeft: -2,
});

export const itemIconRight = style({
	marginRight: -2,
	marginLeft: 12,
});

export const groupLabel = style({
	boxSizing: 'border-box',
	paddingBlock: 8,
	paddingInline: 10,
	maxWidth: fallbackVar(maxWidthVar, 'none'),
	lineHeight: 1.3,
	color: vars.palette.contrast_400,
	fontSize: fontSize.sm,
	fontWeight: 600,
});

export const separator = style({
	flexShrink: 0,
	marginBlock: 4,
	border: 0,
	backgroundColor: vars.palette.contrast_100,
	height: 1,
});

export const itemRadio = style({
	boxSizing: 'border-box',
	display: 'inline-flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	border: `1px solid ${vars.palette.contrast_300}`,
	borderRadius: 999,
	width: 20,
	height: 20,
});

export const itemRadioDot = style({
	borderRadius: 999,
	backgroundColor: vars.palette.primary_500,
	width: 14,
	height: 14,
});
