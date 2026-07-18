import { keyframes } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

const spin = keyframes({ to: { transform: 'rotate(360deg)' } });

export const spinner = recipe(
	{
		base: {
			display: 'inline-flex',
			animation: `${spin} 500ms linear infinite`,
		},
		variants: {
			color: {
				default: {
					color: vars.palette.contrast_900,
				},
				white: {
					color: '#fff',
				},
			},
		},
		defaultVariants: {
			color: 'white',
		},
	},
	{ debugId: 'spinner' },
);
