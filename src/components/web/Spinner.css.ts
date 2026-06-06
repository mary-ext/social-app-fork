import { keyframes, style } from '@vanilla-extract/css';

const spin = keyframes({ to: { transform: 'rotate(360deg)' } });

export const spinner = style({
	animation: `${spin} 500ms linear infinite`,
	display: 'inline-flex',
});
