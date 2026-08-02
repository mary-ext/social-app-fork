import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const controls = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	flexDirection: 'column',
	justifyContent: 'flex-end',
	overflow: 'hidden',
});

export const emptySpace = style({
	appearance: 'none',
	position: 'absolute',
	inset: 0,
	margin: 0,
	border: 0,
	background: 'transparent',
	padding: 0,
	cursor: 'pointer',
	selectors: {
		'&[data-cursor="none"]': { cursor: 'none' },
	},
});

export const gradientBar = style({
	boxSizing: 'border-box',
	position: 'relative',
	flexShrink: 0,
	transition: 'opacity 0.2s ease-in-out',
	opacity: 0,
	background: 'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
	paddingInline: space.xs,
	width: '100%',
	selectors: {
		'&[data-visible="true"]': { opacity: 1 },
		'&[data-modality="touch"]:not([data-visible="true"])': { pointerEvents: 'none' },
	},
});

export const controlsRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	paddingBottom: space.sm,
	paddingInline: space.xs,
});

export const spacer = style({ flex: 1 });

export const timeText = style({
	paddingInline: space.xs,
	color: '#fff',
	fontVariant: 'tabular-nums',
});

export const overlay = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	pointerEvents: 'none',
});

export const errorText = style({ color: '#fff' });
