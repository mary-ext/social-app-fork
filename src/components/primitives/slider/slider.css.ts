import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

const position = 'var(--slider-position)';

export const control = style(
	layered(reset, {
		// browser panning would cancel the drag.
		touchAction: 'none',
	}),
);

export const track = style(
	layered(reset, {
		position: 'relative',
	}),
);

export const indicator = style(
	layered(reset, {
		position: 'absolute',
		insetBlock: 0,
		insetInlineStart: 0,
		inlineSize: position,
		selectors: {
			'&[data-orientation="vertical"]': {
				insetBlock: 'auto 0',
				insetInline: 0,
				inlineSize: 'auto',
				blockSize: position,
			},
		},
	}),
);

export const thumb = style(
	layered(reset, {
		position: 'absolute',
		insetBlockStart: '50%',
		insetInlineStart: position,
		translate: '-50% -50%',
		selectors: {
			'&:dir(rtl)': {
				translate: '50% -50%',
			},
			'&[data-orientation="vertical"]': {
				insetBlock: `auto ${position}`,
				insetInlineStart: '50%',
				translate: '-50% 50%',
			},
			'&[data-orientation="vertical"]:dir(rtl)': {
				translate: '50% 50%',
			},
		},
	}),
);

// sized to the thumb so screen reader focus rings match it.
export const input = style(
	layered(reset, {
		position: 'absolute',
		inset: 0,
		margin: 0,
		border: 0,
		padding: 0,
		inlineSize: '100%',
		blockSize: '100%',
		overflow: 'hidden',
		clipPath: 'inset(50%)',
		whiteSpace: 'nowrap',
		selectors: {
			'&[aria-orientation="vertical"]': {
				writingMode: 'vertical-lr',
				direction: 'rtl',
			},
		},
	}),
);
