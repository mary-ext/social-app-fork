import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const link = style({
	alignItems: 'center',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	maxWidth: '100%',
	textDecoration: 'none',
	selectors: {
		'&:active': { opacity: 0.5 },
	},
});

// underline is applied to the text on link hover (a flex `<a>` doesn't reliably propagate it to children).
export const text = style({
	flexShrink: 1,
	selectors: {
		[`${link}:hover &`]: {
			textDecorationColor: colors.textContrastMedium,
			textDecorationLine: 'underline',
		},
	},
});
