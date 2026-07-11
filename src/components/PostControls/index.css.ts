import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const root = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	justifyContent: 'space-between',
	paddingTop: 12,
});

export const primaryGroup = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
});

export const primaryItem = style({
	alignItems: 'flex-start',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
});

export const replyDisabled = style({ opacity: 0.6 });

export const secondaryGroup = style({
	display: 'flex',
	gap: 16,
	flexDirection: 'row',
	justifyContent: 'flex-end',
});

export const button = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	display: 'inline-flex',
	fontFamily: 'inherit',
	gap: 4,
	padding: 0,
	transitionDuration: '100ms',
	transitionProperty: 'color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:focus-visible': { outline: 'none' },
		'&:disabled': { cursor: 'default', opacity: 0.6 },
	},
});

export const ICON_SIZE = 18;
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
	margin: ((ICON_CIRCLE_SIZE - ICON_SIZE) / 2) * -1,
	selectors: {
		[`${button}:hover:not(:disabled) &`]: { backgroundColor: vars.palette.contrast_50 },
		[`${button}:focus-visible &`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const text = style({
	color: 'inherit',
	whiteSpace: 'nowrap',
});
