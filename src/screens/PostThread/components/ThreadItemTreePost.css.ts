import { style } from '@vanilla-extract/css';

import { TREE_AVI_WIDTH } from '#/screens/PostThread/const';

import { OUTER_SPACE } from '#/components/PostLayout.const';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

const PADDING_TIGHT = 8;
const PADDING_LOOSE = 12;

export const outerRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
});

export const outerRowBorder = style({
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
});

export const hiderIcon = style({
	marginRight: 2,
	marginLeft: 2,
});

export const labelsOnMe = style({
	paddingBottom: space._2xs,
});

export const postAlerts = style({
	paddingBottom: space._2xs,
});

export const innerWrapper = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flex: 1,
	flexDirection: 'column',
	paddingTop: PADDING_TIGHT,
	paddingInline: 16,
	minWidth: 0,
});

export const innerWrapperBordered = style({
	paddingTop: PADDING_LOOSE,
});

export const hoverable = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	cursor: 'pointer',
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});

export const bodyColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const metaRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	minWidth: 0,
});

export const bodyRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	minWidth: 0,
});

export const contentColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	paddingBottom: PADDING_TIGHT,
	paddingLeft: space._2xs,
	minWidth: 0,
});

export const contentColumnLastChild = style({
	paddingBottom: PADDING_LOOSE,
});

export const deletedRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
	alignItems: 'center',
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	paddingRight: OUTER_SPACE / 2,
	paddingLeft: OUTER_SPACE / 2,
	height: TREE_AVI_WIDTH,
	color: colors.text,
});

export const deletedText = style({
	marginTop: space._2xs,
});

export const deletedSpacer = style({
	height: OUTER_SPACE / 2,
});

export const skeleton = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	paddingTop: PADDING_LOOSE,
	paddingInline: OUTER_SPACE,
});
