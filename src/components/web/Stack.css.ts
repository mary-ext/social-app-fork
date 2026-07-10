import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const root = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
		},
		variants: {
			gap: {
				_2xl: { gap: space._2xl },
				lg: { gap: space.lg },
				md: { gap: space.md },
				sm: { gap: space.sm },
				xl: { gap: space.xl },
				xs: { gap: space.xs },
			},
		},
		defaultVariants: { gap: 'lg' },
	},
	{ debugId: 'stack', layer: components },
);
