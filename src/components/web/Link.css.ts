import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';

export const inlineLink = recipe(
	{
		base: {
			cursor: 'pointer',
			textDecoration: 'none',
			selectors: { '&:focus-visible': { outline: 'none' } },
		},
		defaultVariants: { underline: 'hover' },
		variants: {
			underline: {
				always: { textDecoration: 'underline' },
				hover: {
					selectors: {
						'&:focus-visible': { textDecoration: 'underline' },
						'&:hover': { textDecoration: 'underline' },
					},
				},
				none: {},
			},
		},
	},
	{ debugId: 'inlineLink', layer: components },
);
