import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

/** The post row; GalleryBleed measures this host and clips the image-carousel bleed to it. */
export const outer = style({
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: 5,
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
