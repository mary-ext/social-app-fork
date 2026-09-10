import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { layered } from '#/styles/layers';
import { components } from '#/styles/layers.css';
import { borderRadius } from '#/styles/tokens.css';

export const root = style(
	layered(components, {
		appearance: 'none',
		display: 'inline-flex',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 0,
		border: 'none',
		borderRadius: borderRadius.sm,
		backgroundColor: 'transparent',
		padding: 0,
		minHeight: 36,
		cursor: 'pointer',
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			'&[data-disabled]': { cursor: 'default', opacity: 0.5 },
		},
	}),
);

export const box = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		position: 'relative',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
		transitionDuration: '100ms',
		transitionProperty: 'background-color, border-color',
		border: `1px solid ${vars.palette.contrast_100}`,
		borderRadius: 6,
		backgroundColor: vars.palette.contrast_25,
		width: 24,
		height: 24,
		color: vars.palette.white,
		selectors: {
			[`${root}:is([data-checked], [data-indeterminate]) &`]: {
				borderColor: vars.palette.primary_500,
				backgroundColor: vars.palette.primary_500,
			},
			[`${root}[data-indeterminate] &::after`]: {
				position: 'absolute',
				backgroundColor: vars.palette.white,
				width: 10,
				height: 2,
				content: '""',
			},
		},
	}),
);

export const indicator = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	selectors: {
		[`${root}[data-indeterminate] &`]: { visibility: 'hidden' },
	},
});

export const checkIcon = style({
	width: 14,
	height: 14,
});
