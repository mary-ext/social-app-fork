import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

/** A saved-feed row in the feeds list; highlights on hover/press, replacing the old pressable's render-prop. */
export const savedFeedRow = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	flex: 1,
	paddingBlock: space.md,
	paddingInline: space.lg,
	selectors: {
		'&:active': { backgroundColor: colors.contrast_25 },
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});
