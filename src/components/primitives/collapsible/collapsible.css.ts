import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

// without `interpolate-size`, toggles are immediate.
export const root = style(
	layered(reset, {
		interpolateSize: 'allow-keywords',
		selectors: {
			'&::details-content': {
				// keep content visible through the close transition.
				transitionBehavior: 'allow-discrete',
				transitionProperty: 'block-size, content-visibility',
				blockSize: 0,
				overflow: 'clip',
			},
			'&[open]::details-content': {
				blockSize: 'auto',
			},
		},
	}),
);

export const standalone = style(
	layered(reset, {
		interpolateSize: 'allow-keywords',
		transitionProperty: 'block-size',
		blockSize: 'auto',
		// `clip` preserves the automatic flex minimum; allow shrinking below the content size.
		minBlockSize: 0,
		overflow: 'clip',
		'@starting-style': {
			blockSize: 0,
		},
		selectors: {
			'&[data-closed]': {
				blockSize: 0,
			},
		},
	}),
);

export const trigger = style(
	layered(reset, {
		listStyle: 'none',
		userSelect: 'none',
		selectors: {
			'&::-webkit-details-marker': {
				display: 'none',
			},
		},
	}),
);
