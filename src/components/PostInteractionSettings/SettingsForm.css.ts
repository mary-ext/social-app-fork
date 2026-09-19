import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { space } from '#/styles/tokens.css';

const INDICATOR_SIZE = 22;
const ROW_GAP = 14;

export const form = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: space.md,
});

export const sectionHeader = style({
	display: 'block',
	paddingTop: space.sm,
	paddingBottom: 6,
	paddingInline: space.lg,
	letterSpacing: '0.02em',
	textTransform: 'uppercase',
	selectors: {
		'&:not(:first-child)': { paddingTop: space._2xl },
	},
});

export const staticRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: ROW_GAP,
	alignItems: 'center',
	paddingBlock: 10,
	paddingInline: space.lg,
	width: '100%',
	minHeight: 56,
});

export const row = style([
	staticRow,
	{
		appearance: 'none',
		transitionDuration: '100ms',
		transitionProperty: 'background-color',
		outlineOffset: -2,
		margin: 0,
		border: 'none',
		background: 'transparent',
		textAlign: 'left',
		textDecoration: 'none',
		color: 'inherit',
		font: 'inherit',
		cursor: 'pointer',
		selectors: {
			[hover()]: { backgroundColor: vars.palette.contrast_25 },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}` },
		},
	},
]);

export const replyRows = style({
	display: 'flex',
	flexDirection: 'column',
});

// lets the radios lay out as siblings of the groups box in `replyRows`
export const radioGroup = style({
	display: 'contents',
});

export const afterNest = style({
	order: 2,
});

export const nest = style({
	display: 'flex',
	order: 1,
	flexDirection: 'column',
	borderRadius: 12,
	marginInline: space.lg,
	backgroundColor: vars.palette.contrast_25,
	overflow: 'hidden',
});

export const nestedRow = style([
	row,
	{
		minHeight: 48,
		selectors: {
			[hover()]: { backgroundColor: vars.palette.contrast_50 },
		},
	},
]);

export const divider = style({
	marginLeft: space.lg + INDICATOR_SIZE + ROW_GAP,
	marginRight: space.lg,
	borderTop: `1px solid ${colors.borderContrastLow}`,
});

export const text = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 2,
	minWidth: 0,
});

export const icon = style({
	flexShrink: 0,
	width: INDICATOR_SIZE,
	height: INDICATOR_SIZE,
	color: vars.palette.contrast_700,
});

export const chevron = style({
	flexShrink: 0,
	width: 18,
	height: 18,
	color: vars.palette.contrast_400,
});

export const pill = style({
	borderRadius: 999,
	backgroundColor: vars.palette.primary_50,
	paddingBlock: 2,
	paddingInline: 8,
	color: vars.palette.primary_600,
});

const indicator = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	border: `2px solid ${vars.palette.contrast_300}`,
	width: INDICATOR_SIZE,
	height: INDICATOR_SIZE,
	selectors: {
		[`${row}[data-checked] &`]: {
			borderColor: vars.palette.primary_500,
			backgroundColor: vars.palette.primary_500,
		},
	},
});

export const radio = style([indicator, { borderRadius: 999 }]);

export const radioDot = style({
	borderRadius: 999,
	backgroundColor: vars.palette.white,
	width: 8,
	height: 8,
});

export const checkbox = style([indicator, { borderRadius: 6, color: vars.palette.white }]);

export const checkboxIndicator = style({
	display: 'flex',
});

export const checkIcon = style({
	width: 14,
	height: 14,
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
	padding: 3,
	width: 44,
	height: 26,
	selectors: {
		[`${row}[data-checked] &`]: { backgroundColor: vars.palette.primary_500 },
	},
});

export const switchThumb = style({
	transitionDuration: '100ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
	borderRadius: 999,
	backgroundColor: vars.palette.white,
	width: 20,
	height: 20,
	boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
	selectors: {
		[`${row}[data-checked] &`]: { transform: 'translateX(18px)' },
	},
});
