import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

import { MEDIA_INSERT_AFTER_ATTR, MEDIA_INSERT_BEFORE_ATTR, MEDIA_ROW_ATTR } from '../elements';
import { revealOnHover } from '../reveal.css';

export const tile = style({
	position: 'relative',
	borderRadius: borderRadius.sm,
	overflow: 'hidden',
	backgroundColor: vars.palette.contrast_50,
	cursor: 'grab',
	selectors: {
		[`&:not([${MEDIA_ROW_ATTR}])`]: {
			aspectRatio: '1',
		},
		[`&[${MEDIA_ROW_ATTR}]`]: {
			gridColumn: '1 / -1',
		},
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

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

export const tileActions = style([
	revealOnHover,
	{
		display: 'flex',
		position: 'absolute',
		top: space.xs,
		right: space.xs,
		gap: space._2xs,
		selectors: {
			// avoid covering native audio controls.
			[`${voice} &`]: {
				position: 'static',
			},
		},
	},
]);
