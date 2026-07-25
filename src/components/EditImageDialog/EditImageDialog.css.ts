import { style } from '@vanilla-extract/css';

export const loadingHeader = style({
	height: 50,
});

export const loadingBody = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	aspectRatio: '1',
	width: '100%',
});
