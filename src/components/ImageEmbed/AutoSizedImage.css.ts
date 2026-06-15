import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

/** Inner-box aspect ratio (constrained crop) — the bounding-box ratio, not the raw image ratio. */
export const ratioVar = createVar();
/** `paddingTop` percentage that drives the constrained bounding-box height. */
export const padVar = createVar();
/** Button aspect ratio for the uncropped (crop=none) full-bleed path. */
export const maxRatioVar = createVar();

export const outer = style({ width: '100%' });

export const sizer = style({
	overflow: 'hidden',
	paddingTop: padVar,
	// the absolute `abs` child must anchor to this padded box, not escape to a further-up positioned
	// ancestor (which would lift the image up into the top margin).
	position: 'relative',
});

export const abs = style({
	bottom: 0,
	display: 'flex',
	flexDirection: 'row',
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const innerBox = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: borderRadius.md,
	boxSizing: 'border-box',
	height: '100%',
	overflow: 'hidden',
	position: 'relative',
});

export const innerBoxConstrained = style({ aspectRatio: ratioVar });
export const innerBoxFullBleed = style({ width: '100%' });

const pressableBase = style([
	mediaBorder,
	{
		appearance: 'none',
		background: 'transparent',
		borderRadius: borderRadius.md,
		cursor: 'pointer',
		display: 'block',
		margin: 0,
		overflow: 'hidden',
		padding: 0,
		position: 'relative',
		transitionDuration: '200ms',
		transitionProperty: 'transform',
		selectors: {
			'&:active': { transform: 'scale(0.99)' },
			// inset so the body's `GalleryBleed` clip can't trim it; sits 1px in from the hairline border this
			// element already carries, staying concentric with the rounded corners.
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

/** Press target inside the constrained bounding box. */
export const pressable = style([pressableBase, { height: '100%', width: '100%' }]);

/** Press target for the uncropped path — it owns the aspect ratio and the placeholder background. */
export const pressableBleed = style([
	pressableBase,
	{ aspectRatio: maxRatioVar, backgroundColor: vars.palette.contrast_25, width: '100%' },
]);

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

export const imageContain = style({ objectFit: 'contain' });
