import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

import { previewHeight } from './metrics';

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
});

export const filenameLinkInteractive = style([
	filenameLink,
	{
		':hover': {
			textDecoration: 'underline',
		},
	},
]);

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
	height: previewHeight,
});

export const message = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	boxSizing: 'border-box',
	height: '100%',
	padding: space.md,
	textAlign: 'center',
});

export const footer = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingInline: space.md,
	height: 36,
	borderTop: `1px solid ${colors.borderContrastLow}`,
});

export const footerRight = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	flexShrink: 0,
});

export const byline = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
	minWidth: 0,
});

export const bylineInteractive = style([
	byline,
	{
		cursor: 'pointer',
	},
]);

export const bylineHandle = style({
	selectors: {
		[`${bylineInteractive}:hover &`]: {
			textDecoration: 'underline',
			textDecorationColor: colors.textContrastMedium,
		},
	},
});

export const action = style({
	marginRight: -space.sm,
});
