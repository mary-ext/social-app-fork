import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';

const focusRing = {
	outline: `2px solid ${vars.palette.primary_500}`,
	outlineOffset: 2,
} as const;

export const row = style(
	layered(components, {
		alignItems: 'center',
		backgroundColor: vars.palette.contrast_0,
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'row',
		gap: 8,
		paddingBottom: 12,
		paddingLeft: 6,
		paddingRight: 18,
		paddingTop: 12,
		width: '100%',
	}),
);

export const iconButton = style({
	appearance: 'none',
	background: 'none',
	border: 0,
	borderRadius: '50%',
	cursor: 'pointer',
	display: 'inline-flex',
	flexShrink: 0,
	margin: 0,
	padding: 0,
	selectors: {
		'&:focus-visible': focusRing,
	},
});

export const iconCircle = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	boxSizing: 'border-box',
	color: vars.palette.contrast_700,
	display: 'inline-flex',
	justifyContent: 'center',
});

export const name = style({
	flex: 1,
	minWidth: 0,
});

export const toggle = style({
	appearance: 'none',
	background: 'none',
	border: 0,
	cursor: 'pointer',
	flexShrink: 0,
	margin: 0,
	padding: 0,
	selectors: {
		'&:focus-visible': focusRing,
	},
});
