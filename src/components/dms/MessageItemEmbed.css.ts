import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const outer = recipe({
	base: {
		width: '100%',
		minWidth: 280,
		maxWidth: 360,
	},
	variants: {
		indent: {
			true: { marginLeft: space.sm },
		},
	},
});

export const inner = recipe({
	base: {
		overflow: 'hidden',
		border: 'none',
	},
	variants: {
		fromSelf: {
			true: { background: colors.primary_50 },
			false: { background: colors.contrast_50 },
		},
	},
});
