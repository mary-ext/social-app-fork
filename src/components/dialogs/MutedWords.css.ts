import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const addButton = style({ width: '100%' });

export const error = style({
	borderRadius: 8,
	backgroundColor: vars.palette.negative_400,
	padding: 12,
});

export const errorText = style({ fontStyle: 'italic' });
