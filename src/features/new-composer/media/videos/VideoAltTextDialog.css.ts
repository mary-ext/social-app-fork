import { style } from '@vanilla-extract/css';

export const video = style({
	display: 'block',
	borderRadius: 12,
	backgroundColor: 'black',
	width: '100%',
	// keep portrait videos from pushing the field out of view.
	maxHeight: 320,
	objectFit: 'contain',
});
