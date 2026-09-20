import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { MOUSE } from '#/styles/interaction';
import { borderRadius, space } from '#/styles/tokens.css';

import { RIGHT_PADDING } from './consts';
import { MEDIA_INSERT_AFTER_ATTR, MEDIA_INSERT_BEFORE_ATTR, POST_ELEMENT } from './elements';

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingTop: space.sm,
	paddingRight: RIGHT_PADDING,
});

export const grid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
	gap: space.xs,
});

export const tile = style({
	position: 'relative',
	borderRadius: borderRadius.sm,
	overflow: 'hidden',
	backgroundColor: vars.palette.contrast_50,
	aspectRatio: '1',
	cursor: 'grab',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

const insertionLine = {
	position: 'absolute',
	zIndex: 1,
	top: 0,
	bottom: 0,
	backgroundColor: vars.palette.primary_500,
	width: 3,
	content: '""',
} as const;

globalStyle(`${tile}[${MEDIA_INSERT_BEFORE_ATTR}]::before`, { ...insertionLine, left: 0 });
globalStyle(`${tile}[${MEDIA_INSERT_AFTER_ATTR}]::after`, { ...insertionLine, right: 0 });

export const media = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	pointerEvents: 'none',
});

export const tileActions = style({
	display: 'flex',
	position: 'absolute',
	top: space.xs,
	right: space.xs,
	gap: space._2xs,
});

export const toolbar = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
	minHeight: 32,
});

export const spacer = style({
	flexGrow: 1,
});

export const postNumber = style({
	fontVariantNumeric: 'tabular-nums',
	color: vars.palette.contrast_500,
});

export const postAction = style({
	transition: 'opacity 100ms',
});

// keep controls visible on touch devices.
globalStyle(`${MOUSE} ${POST_ELEMENT}:not(:hover) ${postAction}`, {
	opacity: 0,
});
