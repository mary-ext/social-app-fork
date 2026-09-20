import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, emojiFontFamily, fontSize, space, zIndex } from '#/styles/tokens.css';

// the editor's tooltip host handles placement and available-height constraints.
export const popup = style({
	zIndex: zIndex.popover,
	boxSizing: 'border-box',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	backgroundColor: vars.palette.contrast_0,
	paddingBlock: space.xs,
	width: 320,
	maxWidth: '100%',
	maxHeight: 360,
	overflowX: 'hidden',
	overflowY: 'auto',
});

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.sm,
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
	marginBlock: 2,
});

export const profileText = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const emojiGlyph = style({
	lineHeight: 1.15,
	fontFamily: emojiFontFamily,
	fontSize: fontSize.xl,
});

export const emojiName = style({
	minWidth: 0,
});
