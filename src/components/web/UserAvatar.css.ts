import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const sizeVar = createVar();
export const radiusVar = createVar();
/** Live-border thickness (2px above 16px avatars, else 1px), mirroring the RNW `UserAvatar`. */
export const borderWidthVar = createVar();
/** Alert-badge scale factor (`size / 42`), keeping the badge proportional to the avatar. */
export const alertScaleVar = createVar();
/** Corner radius of the `PreviewableUserAvatar` link wrapper (circle vs squared). */
export const previewRadiusVar = createVar();

// the shape radius lives on the root so children inherit it and a consumer `style.borderRadius` can override
// every layer at once.
export const root = style({
	borderRadius: radiusVar,
	display: 'block',
	height: sizeVar,
	position: 'relative',
	width: sizeVar,
});

export const image = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 'inherit',
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

/** Applied to the image when moderation requires blurring the avatar. */
export const blurred = style({ filter: 'blur(5px)' });

export const fallback = style({
	borderRadius: 'inherit',
	display: 'block',
	height: '100%',
	overflow: 'hidden',
	width: '100%',
});

/** Overrides the web `MediaInsetBorder`'s fixed `md` radius so the hairline tracks the avatar's shape. */
export const border = style({
	selectors: { '&&': { borderRadius: 'inherit' } },
});

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
	outline: 0,
	padding: 0,
	textDecoration: 'none',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});
