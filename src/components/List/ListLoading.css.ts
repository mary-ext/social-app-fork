import { style } from '@vanilla-extract/css';

export const container = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingTop: 175,
	paddingBottom: 110,
	height: '100vh',
});
