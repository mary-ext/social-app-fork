import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const sizeVar = createVar();

export const stackOrder = createVar();

const STROKE = 2;

const radius = `calc(${sizeVar} / 2 + ${STROKE}px)`;
const holeX = `calc(${sizeVar} * 13 / 10)`;
const holeY = `calc(${sizeVar} / 2)`;
const mask = `radial-gradient(circle ${radius} at ${holeX} ${holeY}, transparent ${radius}, #000 ${radius})`;

export const stack = style({
	display: 'flex',
	flexDirection: 'row',
	height: sizeVar,
});

export const avatar = style({
	flexShrink: 0,
	height: sizeVar,
	width: sizeVar,
	zIndex: stackOrder,
	selectors: {
		'&:not(:first-child)': { marginLeft: `calc(${sizeVar} / -5)` },
		'&:not(:last-child)': { WebkitMaskImage: mask, maskImage: mask },
	},
});

export const placeholder = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: '50%',
	height: '100%',
	width: '100%',
});
