import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

const clusterBase = style({
	bottom: 4,
	display: 'flex',
	flexDirection: 'row',
	position: 'absolute',
	right: 4,
});

export const cluster = styleVariants({
	regular: [clusterBase, { gap: 3 }],
	large: [clusterBase, { gap: 4 }],
});

const countClusterBase = style({
	display: 'flex',
	flexDirection: 'row',
	position: 'absolute',
	right: 4,
	top: 4,
});

/** The image-count badge sits top-right; the alt/crop cluster sits bottom-right. */
export const countCluster = styleVariants({
	regular: [countClusterBase],
	large: [countClusterBase],
});

const boxBase = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	boxSizing: 'border-box',
	display: 'flex',
	justifyContent: 'center',
	opacity: 0.8,
});

/** The single-image badge uses a 4px radius; the gallery badge uses 8px. Padding grows for the large badge. */
export const box = styleVariants({
	singleRegular: [boxBase, { borderRadius: borderRadius.xs, padding: 3 }],
	singleLarge: [boxBase, { borderRadius: borderRadius.xs, padding: 5 }],
	galleryRegular: [boxBase, { borderRadius: borderRadius.sm, padding: 4 }],
	galleryLarge: [boxBase, { borderRadius: borderRadius.sm, padding: 6 }],
});

/** Fullscreen (cropped) icon; `currentColor` is resolved by the wrapper's `color`. */
export const icon = style({
	color: vars.palette.contrast_900,
	display: 'block',
});

/** The non-large ALT label is 8px, which isn't a font token. */
export const altSmall = style({
	fontSize: 8,
});
