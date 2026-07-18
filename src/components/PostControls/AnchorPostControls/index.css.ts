import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const root = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	alignItems: 'center',
	justifyContent: 'space-evenly',
	height: 52,
});

export const replyDisabled = style({ opacity: 0.6 });

export const button = style({
	appearance: 'none',
	display: 'inline-flex',
	alignItems: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	border: 'none',
	backgroundColor: 'transparent',
	padding: 0,
	color: vars.palette.contrast_500,
	fontFamily: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': { outline: 'none' },
		'&:disabled': { opacity: 0.6, cursor: 'default' },
	},
});

export const ICON_CIRCLE_SIZE = 32;

export const iconCircle = style({
	display: 'inline-flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	borderRadius: 999,
	width: ICON_CIRCLE_SIZE,
	height: ICON_CIRCLE_SIZE,
	selectors: {
		[`${button}:hover:not(:disabled) &`]: { backgroundColor: vars.palette.contrast_25 },
		[`${button}:focus-visible &`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});
