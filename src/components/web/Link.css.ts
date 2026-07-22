import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';

export const inlineLink = recipe(
	{
		base: {
			// reset user-agent chrome so the recipe renders identically on an `<a>` or a `<button>`.
			appearance: 'none',
			margin: 0,
			border: 0,
			padding: 0,
			background: 'transparent',
			textAlign: 'inherit',
			textDecoration: 'none',
			cursor: 'pointer',
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
