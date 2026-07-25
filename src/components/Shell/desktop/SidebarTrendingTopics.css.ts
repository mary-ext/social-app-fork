import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	display: 'flex',
	flexDirection: 'column',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.md,
	borderColor: colors.borderContrastLow,
	padding: space.lg,
});

export const header = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
	paddingBottom: space.md,
});

export const title = style({
	flex: 1,
	minWidth: 0,
});

export const optionsButton = style({
	marginTop: -6,
	marginRight: -6,
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

export const index = style({
	flexShrink: 0,
	minWidth: 16,
	color: colors.textContrastLow,
});

export const topicLink = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'flex-start',
	textDecoration: 'none',
});

export const topicName = style({
	flex: 1,
	minWidth: 0,
	color: colors.textContrastMedium,
	selectors: {
		[`${topicLink}:hover &`]: { textDecoration: 'underline', color: colors.text },
	},
});
