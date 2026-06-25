import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

/** The gif's aspect ratio (width / height), driving the box's shape and its height-capped width. */
export const ratioVar = createVar();

export const outer = style({ width: '100%' });

export const playButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 0,
	bottom: 0,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	margin: 0,
	// the `box` paints the focus ring; suppress the button's own (overflow-clipped) outline.
	outline: 0,
	padding: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 2,
});

export const box = style([
	mediaBorder,
	{
		aspectRatio: ratioVar,
		backgroundColor: '#000',
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		position: 'relative',
		// width caps the height: a portrait gif narrows to `MAX_MEDIA_HEIGHT * ratio` (topping out at that
		// height), while landscape fills the column.
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
		selectors: {
			// ring the tile itself so the outline follows its `borderRadius` concentrically (1px in from the
			// hairline border it carries); inset so the body's `GalleryBleed` clip can't trim it.
			[`&:has(${playButton}:focus-visible)`]: {
				outline: `2px solid ${vars.palette.primary_500}`,
				outlineOffset: -2,
			},
		},
	},
]);

// inset the inner layers by 2px on every edge to hide a sub-pixel clipping seam.
export const inset = style({
	bottom: -2,
	left: -2,
	position: 'absolute',
	right: -2,
	top: -2,
});

export const video = style({
	display: 'block',
	height: '100%',
	width: '100%',
});

const dimBase = style({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 1,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});

// a paused gif is darkened by two stacked overlays (0.2 from the controls + 0.3 outside them).
export const dimInner = style([dimBase, { opacity: 0.2 }]);
export const dimOuter = style([dimBase, { opacity: 0.3 }]);

const badge = style({
	alignItems: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	borderRadius: 6,
	bottom: 6,
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: 3,
	paddingInline: 4,
	position: 'absolute',
	zIndex: 2,
});

export const gifBadge = style([badge, { left: 6 }]);

export const altBadge = style([
	badge,
	{
		appearance: 'none',
		border: 0,
		cursor: 'pointer',
		margin: 0,
		right: 6,
		// inset so the ring rides inside the gif tile's `overflow: hidden`.
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const badgeText = style({
	color: '#fff',
});
