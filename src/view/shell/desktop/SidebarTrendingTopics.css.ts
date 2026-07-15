import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.md,
	borderStyle: 'solid',
	borderWidth: 1,
	display: 'flex',
	flexDirection: 'column',
	padding: space.lg,
});

export const header = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.xs,
	paddingBottom: space.md,
});

export const title = style({
	flex: 1,
	minWidth: 0,
});

export const optionsButton = style({
	marginRight: -6,
	marginTop: -6,
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

export const index = style({
	color: colors.textContrastLow,
	flexShrink: 0,
	minWidth: 16,
});

export const topicLink = style({
	alignItems: 'flex-start',
	display: 'flex',
	gap: space.xs,
	textDecoration: 'none',
});

export const topicName = style({
	color: colors.textContrastMedium,
	flex: 1,
	minWidth: 0,
	selectors: {
		[`${topicLink}:hover &`]: { color: colors.text, textDecoration: 'underline' },
	},
});
