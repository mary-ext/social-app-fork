import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
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

export const box = styleVariants({
	singleRegular: [boxBase, { borderRadius: borderRadius.xs, padding: 3 }],
	singleLarge: [boxBase, { borderRadius: borderRadius.xs, padding: 5 }],
	galleryRegular: [boxBase, { borderRadius: borderRadius.sm, padding: 4 }],
	galleryLarge: [boxBase, { borderRadius: borderRadius.sm, padding: 6 }],
});

export const icon = style({
	color: vars.palette.contrast_900,
	display: 'block',
});

export const altSmall = style({
	fontSize: 8,
	lineHeight: roundToPx('calc(8px * 1.3)'),
});
