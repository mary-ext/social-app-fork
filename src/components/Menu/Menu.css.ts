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
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxShadow: vars.shadow.md,
	boxSizing: 'border-box',
	maxHeight: 'var(--available-height)',
	maxWidth: 'min(var(--available-width), 320px)',
	minWidth: fallbackVar(minWidthVar, 'auto'),
	outline: 0,
	overflowY: 'auto',
	padding: 4,
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

export const item = style({
	alignItems: 'center',
	borderRadius: 4,
	boxSizing: 'border-box',
	color: vars.palette.contrast_900,
	cursor: 'pointer',
	display: 'flex',
	fontSize: fontSize.sm,
	fontWeight: 600,
	gap: 16,
	lineHeight: 1,
	minHeight: 32,
	outline: 0,
	paddingBlock: 8,
	paddingInline: 10,
	textDecoration: 'none',
	userSelect: 'none',
	vars: { [iconColor]: vars.palette.contrast_700 },
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_50 },
		'&[data-disabled]': {
			color: vars.palette.contrast_400,
			cursor: 'default',
			vars: { [iconColor]: vars.palette.contrast_400 },
		},
	},
});

export const itemDestructive = style({
	color: vars.palette.negative_500,
	vars: { [iconColor]: vars.palette.negative_500 },
});

export const itemText = style({
	flex: 1,
});

export const itemIcon = style({
	flexShrink: 0,
	marginLeft: -2,
});

export const itemIconRight = style({
	marginLeft: 12,
	marginRight: -2,
});

export const groupLabel = style({
	boxSizing: 'border-box',
	color: vars.palette.contrast_400,
	fontSize: fontSize.sm,
	fontWeight: 600,
	lineHeight: 1.3,
	maxWidth: fallbackVar(maxWidthVar, 'none'),
	paddingBlock: 8,
	paddingInline: 10,
});

export const separator = style({
	backgroundColor: vars.palette.contrast_100,
	border: 0,
	flexShrink: 0,
	height: 1,
	marginBlock: 4,
});

export const itemRadio = style({
	alignItems: 'center',
	border: `1px solid ${vars.palette.contrast_300}`,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'inline-flex',
	flexShrink: 0,
	height: 20,
	justifyContent: 'center',
	width: 20,
});

export const itemRadioDot = style({
	backgroundColor: vars.palette.primary_500,
	borderRadius: 999,
	height: 14,
	width: 14,
});
