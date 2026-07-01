import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

/**
 * The post row; GalleryBleed measures this host and clips the image-carousel bleed to it. The bottom rhythm
 * is owned by `PostLayout` `ContentColumn`, so the outer box carries no bottom padding.
 */
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

/**
 * The meta row: the spacing-free `PostMeta` leaf (which grows to fill) alongside the trailing overflow menu
 * pinned to the post's top-right. `display: flex` so the row hugs its content instead of inflating on the
 * font strut.
 */
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
