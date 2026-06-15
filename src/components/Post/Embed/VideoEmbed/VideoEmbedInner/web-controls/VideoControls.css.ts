import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const controls = style({
	display: 'flex',
	flexDirection: 'column',
	inset: 0,
	overflow: 'hidden',
	position: 'absolute',
});

export const emptySpace = style({
	appearance: 'none',
	background: 'transparent',
	border: 0,
	cursor: 'pointer',
	flex: 1,
	margin: 0,
	padding: 0,
	width: '100%',
	selectors: {
		'&[data-cursor="none"]': { cursor: 'none' },
	},
});

export const gradientBar = style({
	background: 'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
	// RN Views are border-box; a content-box width:100% + padding overflows right and the controls'
	// overflow:hidden clips the right inset away (the missing right margin).
	boxSizing: 'border-box',
	flexShrink: 0,
	opacity: 0,
	paddingInline: space.xs,
	transition: 'opacity 0.2s ease-in-out',
	width: '100%',
	selectors: {
		'&[data-visible="true"]': { opacity: 1 },
	},
});

export const controlsRow = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
	paddingBottom: space.sm,
	paddingInline: space.xs,
});

export const spacer = style({ flex: 1 });

export const timeText = style({
	color: '#fff',
	fontVariant: 'tabular-nums',
	paddingInline: space.xs,
});

export const overlay = style({
	alignItems: 'center',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	pointerEvents: 'none',
	position: 'absolute',
});

export const errorText = style({ color: '#fff' });
