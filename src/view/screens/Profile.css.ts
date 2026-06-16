import { style } from '@vanilla-extract/css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
	// fixes jumps when switching tabs while scrolled down.
	overflowAnchor: 'none',
});
