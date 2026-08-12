import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const toolbar = style({
	display: 'flex',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: space.sm,
});

export const group = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	gap: space._2xs,
});

export const zoomGroup = style([
	group,
	{
		gap: space.sm,
		marginInlineStart: 'auto',
	},
]);

export const ratioTrigger = style(
	layered(components, {
		gap: space.xs,
		selectors: {
			'&[data-popup-open]': { backgroundColor: vars.palette.contrast_100 },
		},
	}),
);

export const slider = style({
	width: 120,
});

export const sliderControl = style({
	display: 'flex',
	alignItems: 'center',
	height: 24,
	touchAction: 'none',
	cursor: 'pointer',
	userSelect: 'none',
	selectors: {
		'&[data-disabled]': { opacity: 0.5, cursor: 'default' },
	},
});

export const sliderTrack = style({
	position: 'relative',
	borderRadius: borderRadius.full,
	backgroundColor: vars.palette.contrast_100,
	width: '100%',
	height: 4,
});

export const sliderIndicator = style({
	borderRadius: borderRadius.full,
	backgroundColor: vars.palette.primary_500,
});

export const sliderThumb = style({
	borderRadius: borderRadius.full,
	backgroundColor: vars.palette.primary_500,
	width: 14,
	height: 14,
	transition: 'scale 0.1s ease',
	selectors: {
		// widen the pointer target past the visible thumb, as the video sliders do
		'&::after': { content: '""', position: 'absolute', inset: -8 },
		'&:has(:focus-visible)': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
		[`${sliderControl}[data-dragging] &`]: { scale: '1.2' },
	},
});
