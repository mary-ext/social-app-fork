import { style } from '@vanilla-extract/css';

export const loadingHeader = style({
	height: 50,
});

export const loadingBody = style({
	alignItems: 'center',
	aspectRatio: '1',
	display: 'flex',
	justifyContent: 'center',
	width: '100%',
});
