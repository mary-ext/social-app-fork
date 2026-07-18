import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const container = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
		},
		defaultVariants: { small: false },
		variants: {
			small: {
				false: { gap: space.xs },
				true: { gap: space._2xs },
			},
		},
	},
	{ debugId: 'container' },
);
