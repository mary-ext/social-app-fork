import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

export const root = style(
	layered(reset, {
		position: 'relative',
	}),
);

// match the label's bounds for screen reader focus rings.
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
	}),
);
