import { style } from '@vanilla-extract/css';

import { avatarSlot, row } from '../thread-end.css';
import { DROP_TINT } from './drop.css';

export const root = row;

export const active = style({
	selectors: {
		'&::before': DROP_TINT,
	},
});

export const avatar = style([
	avatarSlot,
	{
		boxSizing: 'border-box',
		display: 'grid',
		placeItems: 'center',
		border: '1px dashed currentColor',
		borderRadius: '50%',
	},
]);

export const icon = style({
	width: 24,
	height: 24,
});
