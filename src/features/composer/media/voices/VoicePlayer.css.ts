import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontWeight, space } from '#/styles/tokens.css';

export const player = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
	minWidth: 0,
});

export const waveform = style({
	flex: 1,
	minWidth: 0,
	height: 28,
	cursor: 'pointer',
	touchAction: 'none',
	selectors: {
		'&:focus-visible': {
			borderRadius: 2,
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const bars = style({
	display: 'block',
	width: '100%',
	height: '100%',
	pointerEvents: 'none',
});

export const track = style({
	fill: vars.palette.contrast_300,
});

export const played = style({
	fill: vars.palette.primary_500,
});

export const time = style({
	flexShrink: 0,
	paddingInline: space.xs,
	color: vars.palette.contrast_700,
	fontSize: 13,
	fontVariantNumeric: 'tabular-nums',
	fontWeight: fontWeight.semiBold,
});
