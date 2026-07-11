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
	paddingInline: space.xs,
	paddingTop: space.sm,
});

const cardRadius = 12;

export const card = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: cardRadius,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	width: '100%',
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});

export const panel = style({
	boxSizing: 'border-box',
	height: 'var(--collapsible-panel-height)',
	overflow: 'hidden',
	transitionDuration: '300ms',
	transitionProperty: 'height',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			height: 0,
		},
	},
});

export const row = style({
	alignItems: 'start',
	boxSizing: 'border-box',
	display: 'grid',
	gridTemplateColumns: 'auto minmax(0, 1fr) auto',
	paddingBlock: 14,
	paddingInline: space.lg,
	rowGap: space.xs,
	textAlign: 'left',
	width: '100%',
});

export const rowPlain = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.md,
	paddingBlock: 14,
	paddingInline: space.lg,
	textAlign: 'left',
	width: '100%',
});

export const rowInteractive = style({
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	color: 'inherit',
	cursor: 'pointer',
	font: 'inherit',
	textDecoration: 'none',
	transitionDuration: '100ms, 100ms, 300ms',
	transitionProperty: 'background-color, opacity, border-radius',
	transitionTimingFunction:
		'cubic-bezier(0.17, 0.73, 0.14, 1), cubic-bezier(0.17, 0.73, 0.14, 1), cubic-bezier(0.16, 1, 0.3, 1)',
	selectors: {
		'&:hover:not(:disabled):not([data-disabled])': { backgroundColor: vars.palette.contrast_50 },
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
		'&:disabled, &[data-disabled]': {
			cursor: 'default',
			opacity: 0.5,
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
	color: vars.palette.contrast_500,
	display: 'flex',
	flexShrink: 0,
	gridColumn: 1,
	gridRow: 1,
	marginBlock: (20 - 18) / 2,
	marginRight: space.md,
	selectors: {
		[`.${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const title = style({
	gridColumn: 2,
	gridRow: 1,
	minWidth: 0,
	selectors: {
		[`.${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const subtitle = style({
	gridColumn: '2 / 4',
	gridRow: 2,
	minWidth: 0,
});

export const trailing = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	gap: space.xs,
	gridColumn: 3,
	gridRow: 1,
	marginInlineStart: space.md,
	minHeight: titleLineHeight,
});

export const value = style({
	maxWidth: 'min(220px, 45vw)',
});

export const chevron = style({
	color: vars.palette.contrast_500,
	display: 'flex',
	flexShrink: 0,
	selectors: {
		[`.${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const switchTrack = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_200,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	height: 20,
	padding: 4,
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	width: 32,
	selectors: {
		'[data-checked] &': { backgroundColor: vars.palette.primary_500 },
	},
});

export const switchThumb = style({
	backgroundColor: vars.palette.white,
	borderRadius: 999,
	height: 10,
	transitionDuration: '100ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
	width: 10,
	selectors: {
		'[data-checked] &': { transform: 'translateX(14px)' },
	},
});
