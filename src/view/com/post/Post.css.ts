import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

/** post row component. GalleryBleed measures this host to clip the image-carousel bleed to it. */
export const outer = style({
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	paddingLeft: 16,
	paddingRight: 16,
	paddingTop: 12,
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});

/** Top border separating consecutive standalone posts. */
export const outerBorder = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
});

/** meta row containing the spacing-free `PostMeta` leaf and the trailing overflow menu pinned to the top-right */
export const metaSpacing = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: 4,
});

/** Below-row rhythm for `PostRepliedTo`. */
export const repliedTo = style({
	paddingBottom: 4,
});
