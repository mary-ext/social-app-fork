import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { borderRadius } from '#/styles/tokens.css';

const clusterBase = style({
	display: 'flex',
	position: 'absolute',
	right: 4,
	bottom: 4,
	flexDirection: 'row',
});

export const cluster = styleVariants({
	regular: [clusterBase, { gap: 3 }],
	large: [clusterBase, { gap: 4 }],
});

const countClusterBase = style({
	display: 'flex',
	position: 'absolute',
	top: 4,
	right: 4,
	flexDirection: 'row',
});

export const countCluster = styleVariants({
	regular: [countClusterBase],
	large: [countClusterBase],
});

const boxBase = style({
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	opacity: 0.8,
	backgroundColor: vars.palette.contrast_25,
});

export const box = styleVariants({
	singleRegular: [boxBase, { borderRadius: borderRadius.xs, padding: 3 }],
	singleLarge: [boxBase, { borderRadius: borderRadius.xs, padding: 5 }],
	galleryRegular: [boxBase, { borderRadius: borderRadius.sm, padding: 4 }],
	galleryLarge: [boxBase, { borderRadius: borderRadius.sm, padding: 6 }],
});

export const icon = style({
	display: 'block',
	color: vars.palette.contrast_900,
});

export const altSmall = style({
	lineHeight: roundToPx('calc(8px * 1.3)'),
	fontSize: 8,
});
