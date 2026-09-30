import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import { avatarSlot, row } from '../thread-end.css';

export const root = style([
	row,
	{
		border: 'none',
		background: 'none',
		paddingTop: 0,
		paddingRight: 0,
		textAlign: 'start',
		cursor: 'text',
		selectors: {
			'&:disabled': {
				color: vars.palette.contrast_400,
				cursor: 'default',
			},
		},
	},
]);

export const avatar = style([
	avatarSlot,
	{
		display: 'grid',
		placeItems: 'center',

		selectors: {
			[`${root}:disabled &`]: {
				opacity: 0.5,
			},
		},
	},
]);
