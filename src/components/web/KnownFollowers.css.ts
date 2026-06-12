import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

const AVI_SIZE = 30;

/** Per-avatar stacking order; higher paints on top. Set inline so earlier avatars sit above later ones. */
export const stackOrder = createVar();

export const link = style({
	alignItems: 'center',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	marginLeft: -1,
	maxWidth: '100%',
	textDecoration: 'none',
	selectors: {
		'&:active': { opacity: 0.5 },
	},
});

export const avatars = style({
	display: 'flex',
	flexDirection: 'row',
	height: AVI_SIZE,
});

// the avatars overlap leftward; {@link stackOrder} keeps earlier ones painted on top (positive, so
// none falls behind the opaque header background the way a negative index would).
export const avatarWrap = style({
	borderColor: colors.bg,
	borderRadius: borderRadius.full,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	flexShrink: 0,
	height: AVI_SIZE + 2,
	width: AVI_SIZE + 2,
	zIndex: stackOrder,
	selectors: {
		'&:not(:first-child)': { marginLeft: -8 },
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
