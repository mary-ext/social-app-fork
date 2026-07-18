import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { mediaBorder, mediaOverlay } from '#/styles/media-border.css';

export const sizeVar = createVar();
export const radiusVar = createVar();
export const borderWidthVar = createVar();
export const alertScaleVar = createVar();
export const previewRadiusVar = createVar();

export const root = style(
	layered(components, {
		display: 'block',
		position: 'relative',
		flexShrink: 0,
		borderRadius: radiusVar,
		width: sizeVar,
		height: sizeVar,
	}),
);

export const imageClip = style({
	display: 'block',
	borderRadius: 'inherit',
	backgroundColor: vars.palette.contrast_25,
	width: '100%',
	height: '100%',
	overflow: 'hidden',
});

export const image = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

export const blurred = style({ filter: 'blur(5px)' });

export const fallback = style({
	display: 'block',
	position: 'absolute',
	top: 0,
	left: 0,
	borderRadius: 'inherit',
	width: '100%',
	height: '100%',
	overflow: 'hidden',
});

export const border = style([mediaOverlay, mediaBorder, { borderRadius: 'inherit' }]);

export const liveBorder = style({
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	borderWidth: borderWidthVar,
	borderStyle: 'solid',
	borderRadius: 'inherit',
	borderColor: vars.palette.negative_500,
	pointerEvents: 'none',
});

export const alert = style({
	display: 'flex',
	position: 'absolute',
	right: 0,
	bottom: 0,
	alignItems: 'center',
	justifyContent: 'center',
	transform: `scale(${alertScaleVar})`,
	borderRadius: 999,
	backgroundColor: vars.palette.pink,
	width: 16,
	height: 16,
});

export const preview = style({
	appearance: 'none',
	display: 'block',
	flexShrink: 0,
	outline: 0,
	border: 0,
	borderRadius: previewRadiusVar,
	background: 'transparent',
	padding: 0,
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});
