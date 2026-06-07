import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

// sits above the Base UI Sheet (whose backdrop/viewport are zIndex 10), like the web Menu popup.
export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	maxWidth: 300,
	overflowX: 'hidden',
	overflowY: 'auto',
	zIndex: 11,
});

export const item = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	display: 'flex',
	gap: 8,
	margin: 0,
	textAlign: 'left',
	width: '100%',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_25 },
	},
});

export const itemActive = style({
	backgroundColor: vars.palette.contrast_25,
});

export const profileItem = style({
	paddingBlock: 8,
	paddingInline: 12,
});

export const emojiItem = style({
	paddingBlock: 6,
	paddingInline: 10,
});

export const avatar = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 999,
	flexShrink: 0,
	height: 32,
	objectFit: 'cover',
	width: 32,
});

export const profileText = style({
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
});

export const displayName = style({
	color: vars.palette.contrast_1000,
	fontSize: fontSize.sm,
	fontWeight: 600,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const handle = style({
	color: vars.palette.contrast_700,
	fontSize: fontSize.sm,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const emojiGlyph = style({
	fontSize: fontSize.xl,
	lineHeight: 1.15,
});

export const emojiLabel = style({
	color: vars.palette.contrast_1000,
	fontSize: fontSize.md,
	lineHeight: 1.15,
});
