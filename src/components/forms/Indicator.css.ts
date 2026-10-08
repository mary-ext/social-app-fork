import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

const box = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	border: `2px solid ${vars.palette.contrast_300}`,
	width: 22,
	height: 22,
	selectors: {
		':is([data-checked], [data-indeterminate]) > &': {
			borderColor: vars.palette.primary_500,
			backgroundColor: vars.palette.primary_500,
		},
	},
});

export const radio = style([box, { borderRadius: 999 }]);

export const radioDot = style({
	borderRadius: 999,
	backgroundColor: vars.palette.white,
	width: 8,
	height: 8,
});

export const checkbox = style([
	box,
	{
		position: 'relative',
		borderRadius: 6,
		selectors: {
			'[data-indeterminate] > &::after': {
				position: 'absolute',
				backgroundColor: vars.palette.white,
				width: 10,
				height: 2,
				content: '""',
			},
		},
	},
]);

export const checkboxIndicator = style({
	display: 'flex',
	selectors: {
		'[data-indeterminate] > * > &': { visibility: 'hidden' },
	},
});

// keep the tick white when the container overrides its text color
export const checkIcon = style({
	width: 14,
	height: 14,
	color: vars.palette.white,
});
