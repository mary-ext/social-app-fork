import { style } from '@vanilla-extract/css';

import { MOUSE, PRESSING } from '#/styles/interaction';
import { borderRadius, iconSize } from '#/styles/tokens.css';

export const button = style({
	appearance: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'background-color 0.1s',
	margin: 0,
	border: 0,
	borderRadius: borderRadius.full,
	background: 'transparent',
	height: 32,
	width: 32,
	cursor: 'pointer',
	selectors: {
		[`${MOUSE} &:hover, &[data-popup-open], ${PRESSING}`]: {
			backgroundColor: 'rgba(255, 255, 255, 0.2)',
		},
		'&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
	},
});

export const icon = style({
	width: iconSize.md,
	height: iconSize.md,
	color: '#fff',
});
