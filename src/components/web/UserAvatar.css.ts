import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';

export const sizeVar = createVar();
export const radiusVar = createVar();
/** Live-border thickness (2px above 16px avatars, else 1px). */
export const borderWidthVar = createVar();
/** Alert-badge scale factor (`size / 42`), keeping the badge proportional to the avatar. */
export const alertScaleVar = createVar();
/** Corner radius of the `PreviewableUserAvatar` link wrapper (circle vs squared). */
export const previewRadiusVar = createVar();

// the shape radius lives on the root so children inherit it; root sits in the `components` layer so a
// consumer's (unlayered) `className` border-radius outranks it and overrides every layer at once.
export const root = style(
	layered(components, {
		borderRadius: radiusVar,
		display: 'block',
		flexShrink: 0,
		height: sizeVar,
		position: 'relative',
		width: sizeVar,
	}),
);

// a CSS `filter: blur()` is the element's final paint step, so its own `border-radius` can't clip the
// halo the blur spreads past the edge. this wrapper clips it instead: `overflow: hidden` on a parent
// (with no filter of its own) bounds the blurred child to the avatar's shape. the opaque fill backs the
// blurred image's translucent rim (blur samples transparent pixels past the edge) with a solid color.
export const imageClip = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 'inherit',
	display: 'block',
	height: '100%',
	overflow: 'hidden',
	width: '100%',
});

// no `border-radius` here on purpose: `filter: blur()` paints after an element's own corner clip, so a
// rounded image would have its whole perimeter smeared into the transparent corners (a faded, translucent
// rim). leaving the image square lets `imageClip` carve the circle from the opaque interior of the blur.
// the backdrop fill lives on `imageClip` (behind the image), not here, so it isn't blurred away at the rim.
export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

/** Applied to the image when moderation requires blurring the avatar; clipped to shape by {@link imageClip}. */
export const blurred = style({ filter: 'blur(5px)' });

export const fallback = style({
	borderRadius: 'inherit',
	display: 'block',
	height: '100%',
	left: 0,
	overflow: 'hidden',
	position: 'absolute',
	top: 0,
	width: '100%',
});

/** Overrides the web `MediaInsetBorder`'s fixed `md` radius so the hairline tracks the avatar's shape. */
export const border = style({ borderRadius: 'inherit' });

/** Red inset border shown for live avatars, replacing the hairline. */
export const liveBorder = style({
	borderColor: vars.palette.negative_500,
	borderRadius: 'inherit',
	borderStyle: 'solid',
	borderWidth: borderWidthVar,
	bottom: 0,
	left: 0,
	pointerEvents: 'none',
	position: 'absolute',
	right: 0,
	top: 0,
});

/** Pink moderation-alert badge ("!") pinned to the bottom-right corner; the glyph is a {@link Text} child. */
export const alert = style({
	alignItems: 'center',
	backgroundColor: vars.palette.pink,
	borderRadius: 999,
	bottom: 0,
	display: 'flex',
	height: 16,
	justifyContent: 'center',
	position: 'absolute',
	right: 0,
	transform: `scale(${alertScaleVar})`,
	width: 16,
});

/** Bare interactive wrapper (anchor or button) around a previewable avatar — no chrome, rounded focus ring. */
export const preview = style({
	appearance: 'none',
	background: 'transparent',
	border: 0,
	borderRadius: previewRadiusVar,
	color: 'inherit',
	cursor: 'pointer',
	display: 'block',
	flexShrink: 0,
	outline: 0,
	padding: 0,
	textDecoration: 'none',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});
