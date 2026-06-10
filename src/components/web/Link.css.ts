import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';

/**
 * Anchor styling for an inline text link: pointer cursor plus an underline whose timing the `underline`
 * variant controls — `hover` (the default) underlines on hover/focus, `always` keeps it underlined, `none`
 * never does. The underline inherits the text color (`currentColor`), so it tracks whatever `color` the text
 * recipe applies. Focus shows the same underline rather than a ring, matching the legacy `InlineLinkText`.
 */
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
