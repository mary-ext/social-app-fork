import { style } from '@vanilla-extract/css';

import { hover } from '#/styles/interaction';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: space.sm,
	paddingInline: 10,
});

export const readout = style({
	fontVariant: 'tabular-nums',
});

export const sliderRow = style({
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
});

export const stepper = style({
	appearance: 'none',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	margin: 0,
	border: 0,
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.15)',
	padding: 0,
	width: 28,
	height: 28,
	color: '#fff',
	cursor: 'pointer',
	selectors: {
		[hover(':not(:disabled)')]: {
			backgroundColor: 'rgba(255, 255, 255, 0.3)',
		},
		'&:disabled': { opacity: 0.4, cursor: 'default' },
		'&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
	},
});

export const stepperIcon = style({
	width: iconSize.md,
	height: iconSize.md,
});

export const slider = style({
	flex: 1,
	minWidth: 0,
});

export const control = style({
	display: 'flex',
	flex: 1,
	alignItems: 'center',
	paddingBlock: space.sm,
	touchAction: 'none',
	cursor: 'pointer',
	userSelect: 'none',
});

export const track = style({
	position: 'relative',
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.3)',
	width: '100%',
	height: 4,
});

export const indicator = style({
	borderRadius: borderRadius.full,
	backgroundColor: '#fff',
});

export const thumb = style({
	borderRadius: borderRadius.full,
	backgroundColor: '#fff',
	boxShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
	width: 16,
	height: 16,
	transition: 'scale 0.1s ease',
	selectors: {
		'&::after': {
			content: '""',
			position: 'absolute',
			inset: -8,
		},
		'&:has(:focus-visible)': { outline: '2px solid #fff', outlineOffset: 2 },
		[`${control}[data-dragging] &`]: { scale: '1.5' },
	},
});

export const presets = style({
	display: 'flex',
	gap: space.xs,
});

export const preset = style({
	appearance: 'none',
	display: 'flex',
	flex: 1,
	alignItems: 'center',
	justifyContent: 'center',
	margin: 0,
	border: 0,
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.15)',
	paddingBlock: space.xs,
	paddingInline: space._2xs,
	minWidth: 0,
	color: '#fff',
	cursor: 'pointer',
	selectors: {
		[hover()]: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
		'&[aria-pressed="true"]': { backgroundColor: '#fff', color: '#000' },
		'&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
	},
});

export const presetText = style({ color: 'inherit' });
