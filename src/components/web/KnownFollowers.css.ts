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

export const text = style({
	flexShrink: 1,
	selectors: {
		[`${link}:hover &`]: {
			textDecorationColor: colors.textContrastMedium,
			textDecorationLine: 'underline',
		},
	},
});
