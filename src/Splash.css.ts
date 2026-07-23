import { style } from '@vanilla-extract/css';

export const container = style({
	position: 'fixed',
	inset: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transformOrigin: 'center calc(50% - 50px)',
});

const size = 100;
const ratio = 57 / 64;

export const logo = style({
	position: 'relative',
	top: -50,
	width: size,
	height: size * ratio,
});
