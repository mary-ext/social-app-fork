import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

export const modalViewport = style(
	layered(reset, {
		display: 'block',
		position: 'fixed',
		inset: 0,
		// unlike hidden, clip prevents focus from scrolling the entering popup and disrupting its transition.
		overflow: 'clip',
		margin: 0,
		outline: 0,
		border: 0,
		background: 'none',
		padding: 0,
		width: 'auto',
		maxWidth: 'none',
		height: 'auto',
		maxHeight: 'none',
		color: 'inherit',
		cursor: 'auto',
		'::backdrop': {
			background: 'none',
		},
	}),
);
