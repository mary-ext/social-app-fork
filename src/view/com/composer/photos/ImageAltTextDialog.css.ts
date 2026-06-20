import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// square frame, full-bleed to the sheet's content borders, letterboxing the contained image
export const imageBox = style({
	alignItems: 'center',
	aspectRatio: '1',
	backgroundColor: vars.palette.contrast_50,
	display: 'flex',
	justifyContent: 'center',
	overflow: 'hidden',
	width: '100%',
});

export const image = style({
	height: '100%',
	objectFit: 'contain',
	width: '100%',
});

export const form = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	padding: 16,
});

export const warningRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	marginTop: 8,
});

export const warningIcon = style({
	flexShrink: 0,
});

export const warningText = style({
	fontStyle: 'italic',
});

// muted Save label while there's nothing to save (matches EditProfileDialog's inactive save)
export const inactiveSave = style({
	color: vars.palette.contrast_400,
});
