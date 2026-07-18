import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize, space, zIndex } from '#/styles/tokens.css';

export const positioner = style({
	zIndex: zIndex.popover,
});

export const popup = style({
	boxSizing: 'border-box',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	boxShadow: vars.shadow.lg,
	backgroundColor: vars.palette.contrast_0,
	paddingBlock: space.xs,
	width: 320,
	maxWidth: 'var(--available-width)',
	maxHeight: 'var(--available-height)',
	overflowX: 'hidden',
	overflowY: 'auto',
});

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.sm,
	outline: 'none',
	backgroundColor: 'transparent',
	paddingBlock: 8,
	paddingInline: space.md,
	width: '100%',
	textAlign: 'start',
	color: vars.palette.contrast_1000,
	cursor: 'default',
	userSelect: 'none',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_25 },
	},
});

export const avatar = style({
	marginBlock: (40 - 36) / 2,
});

export const text = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const emojiGlyph = style({
	lineHeight: 1.15,
	fontSize: fontSize.xl,
});
