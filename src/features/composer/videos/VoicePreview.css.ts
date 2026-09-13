import { createVar, keyframes, style, styleVariants } from '@vanilla-extract/css';

import {
	AVATAR_RADIUS,
	DESIGN_HEIGHT,
	DESIGN_WIDTH,
	FONT_SIZE,
	ICON_GAP,
	ICON_SIZE,
	ICON_TOP,
	INK_OPACITY,
	LOBE_DISPLACEMENT,
	LOBE_OPACITY,
	MARGIN,
	PULSE_PERIOD,
} from '#/lib/media/video/transcode/voice/spec';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

export const backgroundVar = createVar();

const lobeXVar = createVar();
const lobeYVar = createVar();

// scale card pixels to the preview width.
const unit = (px: number) => `${(px / DESIGN_WIDTH) * 100}cqw`;

// each lobe peaks along a diagonal.
const LOBE_OFFSET = unit(AVATAR_RADIUS * LOBE_DISPLACEMENT * Math.SQRT1_2);

const pulse = keyframes({
	'50%': {
		translate: `calc(${lobeXVar} * ${LOBE_OFFSET}) calc(${lobeYVar} * ${LOBE_OFFSET})`,
	},
});

export const container = style([
	mediaBorder,
	{
		position: 'relative',
		containerType: 'inline-size',
		overflow: 'hidden',
		marginTop: 4,
		borderRadius: borderRadius.md,
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${DESIGN_WIDTH} / ${DESIGN_HEIGHT}))`,
		aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
		backgroundColor: backgroundVar,
		transition: 'background-color 200ms ease',
	},
]);

export const stage = style({
	position: 'absolute',
	inset: 0,
	// contain the avatar's z-index beneath the overlays.
	isolation: 'isolate',
	display: 'grid',
	placeItems: 'center',
	border: 'none',
	padding: 0,
	background: 'transparent',
	cursor: 'pointer',
});

export const playing = style({});

export const lobe = style({
	gridArea: '1 / 1',
	borderRadius: '50%',
	width: unit(AVATAR_RADIUS * 2),
	height: unit(AVATAR_RADIUS * 2),
	backgroundColor: `rgba(255, 255, 255, ${LOBE_OPACITY})`,
	selectors: {
		[`${playing} &`]: {
			animation: `${pulse} ${PULSE_PERIOD}s linear infinite`,
		},
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			animation: 'none',
		},
	},
});

export const lobeQuadrant = styleVariants({
	southEast: { vars: { [lobeXVar]: '1', [lobeYVar]: '1' } },
	southWest: { vars: { [lobeXVar]: '-1', [lobeYVar]: '1' } },
	northWest: { vars: { [lobeXVar]: '-1', [lobeYVar]: '-1' } },
	northEast: { vars: { [lobeXVar]: '1', [lobeYVar]: '-1' } },
});

export const avatar = style({
	// animated lobes form their own layers; keep the avatar above them.
	position: 'relative',
	zIndex: 1,
	gridArea: '1 / 1',
	borderRadius: '50%',
	width: unit(AVATAR_RADIUS * 2),
	height: unit(AVATAR_RADIUS * 2),
	objectFit: 'cover',
	// hide the halo through transparent avatar pixels.
	backgroundColor: backgroundVar,
});

export const overlay = style({
	position: 'absolute',
	top: unit(ICON_TOP),
	insetInline: unit(MARGIN),
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: unit(ICON_GAP),
	height: unit(ICON_SIZE),
	color: `rgba(255, 255, 255, ${INK_OPACITY})`,
	fontSize: unit(FONT_SIZE),
	lineHeight: 1,
	pointerEvents: 'none',
});

export const meta = style({
	display: 'flex',
	alignItems: 'center',
	gap: unit(ICON_GAP),
	fontVariantNumeric: 'tabular-nums',
});

export const icon = style({
	flexShrink: 0,
	width: unit(ICON_SIZE),
	height: unit(ICON_SIZE),
});

export const label = style({
	overflow: 'hidden',
	fontWeight: 500,
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
});
