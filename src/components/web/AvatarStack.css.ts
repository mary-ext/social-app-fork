import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

/** Avatar box edge length in px, wired inline so the stack scales to the `size` prop. */
export const sizeVar = createVar();

/** Per-avatar paint order; higher sits on top. Earlier avatars carry the higher value. */
export const stackOrder = createVar();

// width of the transparent gap cut between overlapping avatars (replaces the old opaque ring border).
const STROKE = 2;

// each avatar overlaps the previous by a fifth of its width; the upper one is masked with a hole over the
// next avatar's circle (grown by STROKE), so the gap shows the background through instead of a bg-colored ring.
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

// skeleton circle shown for a not-yet-loaded avatar; sized by the wrapper, so the mask cuts it too.
export const placeholder = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: '50%',
	height: '100%',
	width: '100%',
});
