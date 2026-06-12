import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const container = recipe({
	base: {
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
	},
	defaultVariants: { small: false },
	variants: {
		small: {
			false: { gap: space.xs },
			true: { gap: space._2xs },
		},
	},
});
