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
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
});

export const hiderIcon = style({
	marginLeft: 2,
	marginRight: 2,
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
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	paddingTop: PADDING_TIGHT,
	paddingInline: 16,
	position: 'relative',
});

export const innerWrapperBordered = style({
	paddingTop: PADDING_LOOSE,
});

export const hoverable = style({
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
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
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
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
	minWidth: 0,
	paddingLeft: space._2xs,
	paddingBottom: PADDING_TIGHT,
});

export const contentColumnLastChild = style({
	paddingBottom: PADDING_LOOSE,
});

export const deletedRow = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	boxSizing: 'border-box',
	color: colors.text,
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
	height: TREE_AVI_WIDTH,
	paddingLeft: OUTER_SPACE / 2,
	paddingRight: OUTER_SPACE / 2,
});

export const deletedText = style({
	marginTop: space._2xs,
});

export const deletedSpacer = style({
	height: OUTER_SPACE / 2,
});

export const skeleton = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingInline: OUTER_SPACE,
	paddingTop: PADDING_LOOSE,
});
