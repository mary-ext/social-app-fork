import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

export const card = style({
	backgroundColor: colors.bg,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.md,
	borderColor: colors.borderContrastLow,
	width: '100%',
	overflow: 'hidden',
});

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	height: 36,
	paddingInline: space.md,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
});

export const headerIcon = style({
	flexShrink: 0,
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.textContrastMedium,
});

export const filenameLink = style({
	display: 'flex',
	flexGrow: 1,
	minWidth: 0,

	':hover': {
		textDecoration: 'underline',
	},
});

export const domainLink = style({
	display: 'flex',
	flexShrink: 0,

	':hover': {
		textDecoration: 'underline',
		textDecorationColor: colors.textContrastMedium,
	},
});

export const codeArea = style({
	backgroundColor: colors.contrast_25,
});

export const message = style({
	display: 'flex',
	flexDirection: 'column',
	padding: space.md,
});

export const footer = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingInline: space.md,
	height: 36,
	borderTop: `1px solid ${colors.borderContrastLow}`,
});

export const footerSection = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});

export const byline = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
});

export const bylineHandle = style({
	selectors: {
		[`${byline}:hover &`]: {
			textDecoration: 'underline',
			textDecorationColor: colors.textContrastMedium,
		},
	},
});

export const action = style({
	marginRight: -space.sm,
});
