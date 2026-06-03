import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

const clusterBase = style({
	bottom: '4px',
	display: 'flex',
	flexDirection: 'row',
	position: 'absolute',
	right: '4px',
});

export const cluster = styleVariants({
	regular: [clusterBase, { gap: '3px' }],
	large: [clusterBase, { gap: '4px' }],
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
	singleRegular: [boxBase, { borderRadius: `${borderRadius.xs}px`, padding: '3px' }],
	singleLarge: [boxBase, { borderRadius: `${borderRadius.xs}px`, padding: '5px' }],
	galleryRegular: [boxBase, { borderRadius: `${borderRadius.sm}px`, padding: '4px' }],
	galleryLarge: [boxBase, { borderRadius: `${borderRadius.sm}px`, padding: '6px' }],
});

/** Fullscreen (cropped) icon; `currentColor` is resolved by the wrapper's `color`. */
export const icon = style({
	color: vars.palette.contrast_900,
	display: 'block',
});

/** The non-large ALT label is 8px, which isn't a font token; `&&` outranks the `Text` size class. */
export const altSmall = style({
	selectors: {
		'&&': { fontSize: '8px' },
	},
});
