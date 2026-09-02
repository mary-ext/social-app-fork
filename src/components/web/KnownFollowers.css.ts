import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hoverWithin, PRESSING } from '#/styles/interaction';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

// stable base class the `text` hover selector can target; the recipe composes it and layers the gap on top.
const linkBase = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	maxWidth: '100%',
	textDecoration: 'none',
	cursor: 'pointer',
	selectors: {
		[PRESSING]: { opacity: 0.5 },
	},
});

export const link = recipe(
	{
		base: [linkBase],
		defaultVariants: { variant: 'default' },
		variants: {
			variant: {
				compact: { gap: space.sm },
				default: { gap: space.md },
			},
		},
	},
	{ debugId: 'knownFollowersLink' },
);

export const text = style({
	flexShrink: 1,
	selectors: {
		[hoverWithin(linkBase)]: {
			textDecorationColor: colors.textContrastMedium,
			textDecorationLine: 'underline',
		},
	},
});
