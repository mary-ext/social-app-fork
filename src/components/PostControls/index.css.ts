import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const root = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingTop: 12,
});

export const primaryGroup = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
});

export const primaryItem = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	alignItems: 'flex-start',
});

export const replyDisabled = style({ opacity: 0.6 });

export const secondaryGroup = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 16,
	justifyContent: 'flex-end',
});

export const button = style({
	appearance: 'none',
	display: 'inline-flex',
	gap: 4,
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

export const ICON_SIZE = 18;
export const ICON_CIRCLE_SIZE = 32;

export const iconCircle = style({
	display: 'inline-flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	margin: ((ICON_CIRCLE_SIZE - ICON_SIZE) / 2) * -1,
	borderRadius: 999,
	width: ICON_CIRCLE_SIZE,
	height: ICON_CIRCLE_SIZE,
	selectors: {
		[`${button}:hover:not(:disabled) &`]: { backgroundColor: vars.palette.contrast_50 },
		[`${button}:focus-visible &`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const text = style({
	whiteSpace: 'nowrap',
	color: 'inherit',
});

export const pointerEventsNone = style({ pointerEvents: 'none' });
