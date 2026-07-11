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
		borderRadius: radiusVar,
		display: 'block',
		flexShrink: 0,
		height: sizeVar,
		position: 'relative',
		width: sizeVar,
	}),
);

export const imageClip = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 'inherit',
	display: 'block',
	height: '100%',
	overflow: 'hidden',
	width: '100%',
});

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

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

export const border = style([mediaOverlay, mediaBorder, { borderRadius: 'inherit' }]);

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
