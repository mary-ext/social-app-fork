import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const topBorder = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	width: '100%',
});

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

// a flat full-width pressable row (not a pill button), matching the bare pressable + rectangular hover the
// original used
export const loadMore = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: colors.bg,
	border: 'none',
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	justifyContent: 'center',
	margin: 0,
	paddingBlock: space.md,
	paddingInline: space.lg,
	width: '100%',
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

export const profilePlaceholder = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.lg,
	paddingInline: space.lg,
});

export const errorOuter = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingInline: space.md,
	paddingTop: space.md,
});

export const errorBox = style({
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
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
