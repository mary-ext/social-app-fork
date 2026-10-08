import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { iconSize, space } from '#/styles/tokens.css';

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

const checked = '&[data-checked]';

export const card = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.md,
	alignItems: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color, box-shadow',
	margin: 0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 14,
	backgroundColor: vars.palette.contrast_0,
	paddingBlock: 10,
	paddingRight: 14,
	paddingLeft: 10,
	width: '100%',
	textAlign: 'left',
	color: 'inherit',
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		[hover(':not([data-checked], [data-disabled])')]: {
			borderColor: vars.palette.contrast_200,
			backgroundColor: vars.palette.contrast_25,
		},
		[checked]: {
			borderColor: vars.palette.primary_500,
			boxShadow: `inset 0 0 0 1px ${vars.palette.primary_500}`,
			backgroundColor: vars.palette.primary_25,
		},
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
		'&[data-disabled]': {
			opacity: 0.5,
			cursor: 'default',
		},
	},
});

export const icon = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	borderRadius: 10,
	backgroundColor: vars.palette.contrast_50,
	padding: (36 - iconSize.lg) / 2,
	width: 36,
	height: 36,
	color: vars.palette.contrast_700,
	selectors: {
		[`${card}[data-checked] &`]: {
			backgroundColor: vars.palette.primary_100,
			color: vars.palette.primary_600,
		},
	},
});

export const title = style({
	flex: 1,
	minWidth: 0,
	selectors: {
		[`${card}:not([data-checked]) &`]: {
			color: vars.palette.contrast_700,
		},
		[`${card}[data-checked] &`]: {
			fontWeight: 600,
		},
	},
});
