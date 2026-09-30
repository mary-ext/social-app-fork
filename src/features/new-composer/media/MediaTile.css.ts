import { createVar, globalStyle, style } from '@vanilla-extract/css';

import * as strip from '#/components/ImageEmbed/carousel/strip.css';
import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { borderRadius, fontWeight, space } from '#/styles/tokens.css';

import { MEDIA_INSERT_AFTER_ATTR, MEDIA_INSERT_BEFORE_ATTR, MEDIA_ROW_ATTR } from '../elements';
import { revealOnHover } from '../reveal.css';

export const tile = style({
	position: 'relative',
	borderRadius: borderRadius.sm,
	overflow: 'hidden',
	backgroundColor: vars.palette.contrast_50,
	selectors: {
		[`&[${MEDIA_ROW_ATTR}]`]: {
			gridColumn: '1 / -1',
		},
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const square = style({
	aspectRatio: '1',
});

export const ratioVar = createVar();

// preserve the aspect ratio within the feed's height limit.
export const single = style({
	borderRadius: borderRadius.md,
	aspectRatio: ratioVar,
	width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
});

export const stripTile = style([strip.tile, { borderRadius: borderRadius.md }]);

export const voice = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.xs,
	padding: space.xs,
});

const insertionLine = {
	position: 'absolute',
	zIndex: 1,
	backgroundColor: vars.palette.primary_500,
	content: '""',
} as const;

const cellLine = { ...insertionLine, top: 0, bottom: 0, width: 3 };
const rowLine = { ...insertionLine, right: 0, left: 0, height: 3 };

const cell = `${tile}:not([${MEDIA_ROW_ATTR}])`;
const row = `${tile}[${MEDIA_ROW_ATTR}]`;

globalStyle(`${cell}[${MEDIA_INSERT_BEFORE_ATTR}]::before`, { ...cellLine, left: 0 });
globalStyle(`${cell}[${MEDIA_INSERT_AFTER_ATTR}]::after`, { ...cellLine, right: 0 });
globalStyle(`${row}[${MEDIA_INSERT_BEFORE_ATTR}]::before`, { ...rowLine, top: 0 });
globalStyle(`${row}[${MEDIA_INSERT_AFTER_ATTR}]::after`, { ...rowLine, bottom: 0 });

export const media = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	pointerEvents: 'none',
});

export const frame = style({
	display: 'block',
	width: '100%',
	maxHeight: 360,
	// use 16:9 until intrinsic dimensions are available.
	aspectRatio: 'auto 16 / 9',
	objectFit: 'contain',
	pointerEvents: 'none',
});

export const audio = style({
	display: 'block',
	flex: 1,
	minWidth: 0,
});

// keep contrast over media in either theme.
const OVERLAY_BACKGROUND = 'rgba(0, 0, 0, 0.72)';
const OVERLAY_HOVER_BACKGROUND = 'rgba(0, 0, 0, 0.85)';
// an odd-sized box centers 13px icons at integer offsets.
const OVERLAY_SIZE = 27;

const overlay = style({
	backgroundColor: OVERLAY_BACKGROUND,
	color: vars.palette.white,
	selectors: {
		[hover()]: { backgroundColor: OVERLAY_HOVER_BACKGROUND },
	},
});

const badge = style({
	display: 'flex',
	position: 'absolute',
	bottom: space.sm,
	left: space.sm,
	alignItems: 'center',
	boxSizing: 'border-box',
	borderRadius: 999,
	height: OVERLAY_SIZE,
	fontSize: 12,
	fontWeight: fontWeight.semiBold,
	lineHeight: 1,
	selectors: {
		// avoid covering native audio controls.
		[`${voice} &`]: {
			position: 'static',
			flexShrink: 0,
		},
	},
});

export const altChip = style([badge, overlay, { gap: space.xs, padding: '0 11px 0 8px' }]);

export const altCheck = style({
	color: vars.palette.positive_500,
});

export const uploadBadge = style([badge, overlay, { gap: 6, padding: '0 11px 0 5px' }]);

export const overlayButton = style([
	overlay,
	{
		borderRadius: 999,
		width: OVERLAY_SIZE,
		height: OVERLAY_SIZE,
		padding: 0,
	},
]);

// 13px scales the glyphs' 2-unit strokes to roughly 1px.
export const overlayIcon = style({
	display: 'block',
	width: 13,
	height: 13,
});

export const tileActions = style([
	revealOnHover,
	{
		display: 'flex',
		position: 'absolute',
		top: space.sm,
		right: space.sm,
		gap: 6,
		selectors: {
			// avoid covering native audio controls.
			[`${voice} &`]: {
				position: 'static',
			},
		},
	},
]);
