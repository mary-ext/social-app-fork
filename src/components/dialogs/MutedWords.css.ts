import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const form = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});

export const intro = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const addButton = style({ width: '100%' });

export const manageRow = style({
	display: 'flex',
	justifyContent: 'center',
});

export const error = style({
	backgroundColor: vars.palette.negative_400,
	borderRadius: 8,
	padding: 12,
});

export const errorText = style({ fontStyle: 'italic' });
