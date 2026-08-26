import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { roundToPx } from '#/styles/round';
import { borderRadius, fontLeading, fontSize, space } from '#/styles/tokens.css';

const pill = style({
	display: 'inline-flex',
	flexShrink: 0,
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_50,
	paddingInline: 5,
	lineHeight: roundToPx(`calc(${fontSize.xs} * ${fontLeading.xs})`),
	fontVariantNumeric: 'tabular-nums',
});

export const inline = style([
	pill,
	{
		verticalAlign: 'middle',
		marginInlineStart: space.xs,
	},
]);

export const block = style([
	pill,
	{
		alignSelf: 'flex-start',
	},
]);
