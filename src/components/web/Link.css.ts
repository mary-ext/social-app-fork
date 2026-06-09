import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';

/**
 * Anchor styling for an inline text link: pointer cursor plus an underline that appears on hover/focus. The
 * underline inherits the text color (`currentColor`), so it tracks whatever `color` the text recipe applies.
 * Focus shows the same underline rather than a ring, matching the legacy `InlineLinkText`.
 */
export const inlineLink = recipe(
	{
		base: {
			cursor: 'pointer',
			textDecoration: 'none',
			selectors: { '&:focus-visible': { outline: 'none' } },
		},
		defaultVariants: { underline: true },
		variants: {
			underline: {
				false: {},
				true: {
					selectors: {
						'&:focus-visible': { textDecoration: 'underline' },
						'&:hover': { textDecoration: 'underline' },
					},
				},
			},
		},
	},
	{ debugId: 'inlineLink', layer: components },
);
