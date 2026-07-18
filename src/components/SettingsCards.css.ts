import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize, space } from '#/styles/tokens.css';

const titleLineHeight = roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`);

export const list = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	paddingBlock: space.lg,
	paddingInline: space.lg,
	width: '100%',
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
});

export const sectionHeader = style({
	paddingBottom: space.md,
});

export const sectionBody = style({
	paddingBottom: space.md,
});

export const sectionFootnote = style({
	paddingTop: space.sm,
	paddingInline: space.xs,
});

const cardRadius = 12;

export const card = style({
	display: 'flex',
	flexDirection: 'column',
	borderRadius: cardRadius,
	backgroundColor: vars.palette.contrast_25,
	width: '100%',
	overflow: 'hidden',
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});

export const panel = style({
	boxSizing: 'border-box',
	transitionDuration: '300ms',
	transitionProperty: 'height',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	height: 'var(--collapsible-panel-height)',
	overflow: 'hidden',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			height: 0,
		},
	},
});

export const row = style({
	boxSizing: 'border-box',
	display: 'grid',
	gridTemplateColumns: 'auto minmax(0, 1fr) auto',
	rowGap: space.xs,
	alignItems: 'start',
	paddingBlock: 14,
	paddingInline: space.lg,
	width: '100%',
	textAlign: 'left',
});

export const rowPlain = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.md,
	alignItems: 'center',
	paddingBlock: 14,
	paddingInline: space.lg,
	width: '100%',
	textAlign: 'left',
});

export const rowInteractive = style({
	appearance: 'none',
	transitionDuration: '100ms, 100ms, 300ms',
	transitionProperty: 'background-color, opacity, border-radius',
	transitionTimingFunction:
		'cubic-bezier(0.17, 0.73, 0.14, 1), cubic-bezier(0.17, 0.73, 0.14, 1), cubic-bezier(0.16, 1, 0.3, 1)',
	border: 'none',
	background: 'transparent',
	textDecoration: 'none',
	color: 'inherit',
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover:not(:disabled):not([data-disabled])': { backgroundColor: vars.palette.contrast_50 },
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
		'&:disabled, &[data-disabled]': {
			opacity: 0.5,
			cursor: 'default',
		},
	},
});

export const rowPrimarySubtle = style({
	backgroundColor: vars.palette.primary_50,
	selectors: {
		'&:hover:not(:disabled):not([data-disabled])': {
			backgroundColor: vars.palette.primary_100,
		},
	},
});

export const rowFirst = style({
	borderTopLeftRadius: cardRadius,
	borderTopRightRadius: cardRadius,
});

export const rowLast = style({
	borderBottomLeftRadius: cardRadius,
	borderBottomRightRadius: cardRadius,
});

export const icon = style({
	display: 'flex',
	flexShrink: 0,
	gridRow: 1,
	gridColumn: 1,
	marginRight: space.md,
	marginBlock: (20 - 18) / 2,
	color: vars.palette.contrast_500,
	selectors: {
		[`.${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const title = style({
	gridRow: 1,
	gridColumn: 2,
	minWidth: 0,
	selectors: {
		[`.${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const subtitle = style({
	gridRow: 2,
	gridColumn: '2 / 4',
	minWidth: 0,
});

export const trailing = style({
	display: 'flex',
	flexShrink: 0,
	gridRow: 1,
	gridColumn: 3,
	gap: space.xs,
	alignItems: 'center',
	marginInlineStart: space.md,
	minHeight: titleLineHeight,
});

export const value = style({
	maxWidth: 'min(220px, 45vw)',
});

export const chevron = style({
	display: 'flex',
	flexShrink: 0,
	color: vars.palette.contrast_500,
	selectors: {
		[`.${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const switchTrack = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_200,
	padding: 4,
	width: 32,
	height: 20,
	selectors: {
		'[data-checked] &': { backgroundColor: vars.palette.primary_500 },
	},
});

export const switchThumb = style({
	transitionDuration: '100ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
	borderRadius: 999,
	backgroundColor: vars.palette.white,
	width: 10,
	height: 10,
	selectors: {
		'[data-checked] &': { transform: 'translateX(14px)' },
	},
});
