import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const root = style({
	height: 52,
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	justifyContent: 'space-evenly',
});

export const replyDisabled = style({ opacity: 0.6 });

export const button = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	display: 'inline-flex',
	fontFamily: 'inherit',
	padding: 0,
	transitionDuration: '100ms',
	transitionProperty: 'color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:focus-visible': { outline: 'none' },
		'&:disabled': { cursor: 'default', opacity: 0.6 },
	},
});

export const ICON_CIRCLE_SIZE = 32;

export const iconCircle = style({
	alignItems: 'center',
	borderRadius: 999,
	display: 'inline-flex',
	flexShrink: 0,
	height: ICON_CIRCLE_SIZE,
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	width: ICON_CIRCLE_SIZE,
	selectors: {
		[`${button}:hover:not(:disabled) &`]: { backgroundColor: vars.palette.contrast_25 },
		[`${button}:focus-visible &`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});
