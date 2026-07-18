import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const tabbedHeader = style({
	paddingBottom: space.md,
});

export const tabbedHeaderInner = style({
	paddingBottom: space.xs,
});

export const admonitionWrap = style({
	paddingBottom: space.lg,
	paddingInline: space.lg,
});

export const cardWrap = style({
	paddingBottom: space.lg,
	paddingInline: space.lg,
});

export const loadMoreWrap = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
});

export const loadMore = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'center',
	margin: 0,
	border: 'none',
	backgroundColor: colors.bg,
	paddingBlock: space.md,
	paddingInline: space.lg,
	width: '100%',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

export const errorOuter = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingTop: space.md,
	paddingInline: space.md,
});

export const errorBox = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	padding: space.lg,
});

export const errorTextCol = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.sm,
	minWidth: 0,
});

export const errorDetail = style({
	fontStyle: 'italic',
});

export const previewSpacer = style({
	paddingTop: space._4xl,
	width: '100%',
});

export const previewHeader = style({
	paddingTop: space.xs,
});

export const previewHeaderText = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const previewFooter = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingTop: space._4xl,
	width: '100%',
});

export const bottomSpacer = style({
	height: 100,
});
