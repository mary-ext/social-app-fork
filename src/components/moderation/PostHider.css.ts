import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';

const focusRing = {
	outline: `2px solid ${vars.palette.primary_500}`,
	outlineOffset: 2,
} as const;

export const row = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
		backgroundColor: vars.palette.contrast_0,
		paddingTop: 12,
		paddingRight: 18,
		paddingBottom: 12,
		paddingLeft: 6,
		width: '100%',
	}),
);

export const iconButton = style({
	appearance: 'none',
	display: 'inline-flex',
	flexShrink: 0,
	margin: 0,
	border: 0,
	borderRadius: '50%',
	background: 'none',
	padding: 0,
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': focusRing,
	},
});

export const iconCircle = style({
	boxSizing: 'border-box',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: vars.palette.contrast_25,
	color: vars.palette.contrast_700,
});

export const name = style({
	flex: 1,
	minWidth: 0,
});

export const toggle = style({
	appearance: 'none',
	flexShrink: 0,
	margin: 0,
	border: 0,
	background: 'none',
	padding: 0,
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': focusRing,
	},
});
