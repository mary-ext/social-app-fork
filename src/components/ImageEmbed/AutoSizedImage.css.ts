import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

/** Image aspect ratio (width / height), driving the box's shape and — for the constrained path — its width. */
export const ratioVar = createVar();

const base = style([
	mediaBorder,
	{
		appearance: 'none',
		backgroundColor: vars.palette.contrast_25,
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

/**
 * Feed crop: the image keeps its ratio but never exceeds {@link MAX_MEDIA_HEIGHT} tall — clamping the width
 * to `height * ratio` shrinks a portrait so it caps out at that height and sits narrow, while landscape fills
 * the column.
 */
export const constrained = style([
	base,
	{ aspectRatio: ratioVar, width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))` },
]);

/** Uncropped path (thread anchor): the image keeps its ratio at full column width, no height cap. */
export const uncapped = style([base, { aspectRatio: ratioVar, width: '100%' }]);

/** Square crop (record-with-media quote): a compact 1:1 thumbnail, the image cover-cropped to fill it. */
export const square = style([base, { aspectRatio: '1', width: '100%' }]);

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

export const imageContain = style({ objectFit: 'contain' });
