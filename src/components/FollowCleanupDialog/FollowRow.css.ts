import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { borderRadius, monoFontFamily, space } from '#/styles/tokens.css';

export const row = style({
	boxSizing: 'border-box',
	alignItems: 'flex-start',
	gap: space.md,
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.md,
	paddingInline: space.lg,
	selectors: {
		[hover()]: {
			backgroundColor: colors.contrast_25,
		},
	},
});

export const rowBody = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	gap: space.xs,
	minWidth: 0,
});

export const did = style({
	fontFamily: monoFontFamily,
	wordBreak: 'break-all',
});

export const metadataDid = style([
	did,
	{
		flex: '1 1 0',
		marginInlineStart: 'auto',
		minWidth: 0,
		textAlign: 'right',
	},
]);

export const issues = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	columnGap: space.sm,
	rowGap: space.xs,
});

export const issuePill = style({
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_25,
	paddingBlock: space._2xs,
	paddingInline: space.sm,
});
