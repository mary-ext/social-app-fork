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
	paddingLeft: 10,
	paddingRight: 15,
	paddingTop: 10,
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

/** The standalone surface's trailing space below the gated content, before the controls. */
export const contentBottom = style({
	marginBottom: 2,
});

/**
 * Below-meta rhythm for the spacing-free `PostMeta` leaf. `display: flex` so the wrapper hugs the row instead
 * of inflating it with the font strut.
 */
export const metaSpacing = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: 4,
});

/** Below-row rhythm for `PostRepliedTo`. */
export const repliedTo = style({
	paddingBottom: 4,
});
