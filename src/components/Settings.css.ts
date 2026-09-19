import { createVar, globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { iconSize, space } from '#/styles/tokens.css';

const LEADING_SIZE = 22;
const ROW_GAP = 14;
const ROW_PADDING_BLOCK = 14;
const GROUP_RADIUS = 12;

// inherited variables let rows adapt to their container's corners and hover color
const containerRadius = createVar();
const radiusTop = createVar();
const radiusBottom = createVar();
const rowHover = createVar();

const enabledHover = hover(':not(:disabled):not([data-disabled])');

const divider = {
	content: '""',
	position: 'absolute',
	top: 0,
	right: space.lg,
	left: space.lg,
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	pointerEvents: 'none',
} as const;

// #region list and sections

export const list = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	paddingBlock: space.lg,
	paddingInline: space.lg,
	width: '100%',
});

export const listFlush = style({
	gap: space.lg,
	paddingTop: 0,
	paddingBottom: space.md,
	paddingInline: 0,
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
});

export const sectionHeading = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	paddingBottom: space.md,
	selectors: {
		[`${listFlush} &`]: {
			paddingTop: space.sm,
			paddingBottom: space.xs,
			paddingInline: space.lg,
		},
	},
});

export const sectionFootnote = style({
	paddingTop: space.sm,
	paddingInline: space.xs,
});

// #endregion

// #region row containers

export const item = style({
	position: 'relative',
	borderRadius: `${radiusTop} ${radiusTop} ${radiusBottom} ${radiusBottom}`,
	selectors: {
		'&:not(:first-child)::before': divider,
	},
});

const rows = style({
	display: 'flex',
	flexDirection: 'column',
	vars: {
		[radiusTop]: '0px',
		[radiusBottom]: '0px',
	},
});

globalStyle(`${rows} > :nth-child(1 of ${item})`, {
	vars: { [radiusTop]: containerRadius },
});

globalStyle(`${rows} > :nth-last-child(1 of ${item})`, {
	vars: { [radiusBottom]: containerRadius },
});

const tinted = style([
	rows,
	{
		borderRadius: GROUP_RADIUS,
		backgroundColor: vars.palette.contrast_25,
		vars: {
			[containerRadius]: `${GROUP_RADIUS}px`,
			[rowHover]: vars.palette.contrast_50,
		},
	},
]);

export const card = style([
	tinted,
	{
		width: '100%',
		selectors: {
			[`${listFlush} &`]: {
				borderRadius: 0,
				backgroundColor: 'transparent',
				vars: {
					[containerRadius]: '0px',
					[rowHover]: vars.palette.contrast_25,
				},
			},
		},
	},
]);

export const group = style([tinted, { marginInline: space.lg }]);

// #endregion

// #region rows

// equal-width icons and indicators keep row labels aligned
export const leading = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	width: LEADING_SIZE,
	height: LEADING_SIZE,
	color: vars.palette.contrast_700,
});

// let avatars overflow the slot without shrinking
globalStyle(`${leading} > *`, {
	flexShrink: 0,
});

export const row = style([
	item,
	{
		boxSizing: 'border-box',
		display: 'flex',
		gap: ROW_GAP,
		alignItems: 'center',
		paddingBlock: ROW_PADDING_BLOCK,
		paddingInline: space.lg,
		width: '100%',
		textAlign: 'left',
	},
]);

export const rowInteractive = style({
	appearance: 'none',
	transitionDuration: '100ms, 100ms, 300ms',
	transitionProperty: 'background-color, opacity, border-radius',
	transitionTimingFunction:
		'cubic-bezier(0.17, 0.73, 0.14, 1), cubic-bezier(0.17, 0.73, 0.14, 1), cubic-bezier(0.16, 1, 0.3, 1)',
	margin: 0,
	border: 'none',
	background: 'transparent',
	textDecoration: 'none',
	color: 'inherit',
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		[enabledHover]: { backgroundColor: rowHover },
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

export const rowNegative = style({});

export const rowPrimarySubtle = style({
	backgroundColor: vars.palette.primary_50,
	selectors: {
		[enabledHover]: {
			backgroundColor: vars.palette.primary_100,
		},
	},
});

globalStyle(`${rowPrimarySubtle} ${leading}`, {
	color: vars.palette.primary_600,
});

export const collapsibleTrigger = style({
	selectors: {
		'&[data-panel-open]': {
			vars: { [radiusBottom]: '0px' },
		},
	},
});

export const panel = style({
	boxSizing: 'border-box',
	transitionDuration: '300ms',
	transitionProperty: 'height',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	height: 'var(--collapsible-panel-height)',
	overflow: 'hidden',
	vars: { [radiusTop]: '0px' },
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			height: 0,
		},
	},
});

export const panelRows = style({
	display: 'flex',
	flexDirection: 'column',
});

// low specificity lets the label inset below override the divider's left edge
globalStyle(`:where(${panelRows} > ${item}:first-child)::before`, divider);

// align dividers with the preceding row's label. for disclosures, use the trigger when closed
// and the last panel row when open.
{
	const labelInset = space.lg + LEADING_SIZE + ROW_GAP;
	const led = `${item}:has(> ${leading}, > :first-child:not([data-panel-open]) > ${leading}, > ${panel} > :nth-last-child(1 of ${item}) > ${leading})`;

	// switches, radios, and checkboxes leave a hidden input between them and the next row
	globalStyle(
		`:is(${led} + ${item}, ${led} + input + ${item}, ${collapsibleTrigger}:has(> ${leading}) + ${panelRows} > ${item}:first-child)::before`,
		{ left: labelInset },
	);
}

// only the last panel row inherits the disclosure's bottom corners
globalStyle(`${panelRows} > :not(:nth-last-child(1 of ${item}))`, {
	vars: { [radiusBottom]: '0px' },
});

export const panelBody = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBottom: ROW_PADDING_BLOCK,
	paddingInline: space.lg,
	width: '100%',
});

// #endregion

// #region row contents

export const label = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	overflowWrap: 'anywhere',
});

export const title = style({
	selectors: {
		[`${rowNegative} &`]: { color: vars.palette.negative_500 },
		[`${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const trailing = style({
	display: 'flex',
	flexShrink: 0,
	gap: space.xs,
	alignItems: 'center',
	color: vars.palette.contrast_500,
	selectors: {
		[`${rowPrimarySubtle} &`]: { color: vars.palette.primary_600 },
	},
});

export const value = style({
	maxWidth: 'min(220px, 45vw)',
});

export const chevron = style({
	display: 'flex',
	flexShrink: 0,
	width: iconSize.md,
	height: iconSize.md,
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
		'[data-checked] &': { backgroundColor: vars.palette.primary_500 },
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
		'[data-checked] &': { transform: 'translateX(18px)' },
	},
});

const indicator = style({
	boxSizing: 'border-box',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	border: `2px solid ${vars.palette.contrast_300}`,
	selectors: {
		'[data-checked] > &': {
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

// #endregion
