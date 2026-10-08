import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

import { topLayerReset } from './top-layer.css';

export const modalViewport = style([
	topLayerReset,
	layered(reset, {
		display: 'block',
		position: 'fixed',
		inset: 0,
		// unlike hidden, clip prevents focus from scrolling the entering popup and disrupting its transition.
		overflow: 'clip',
		outline: 0,
		width: 'auto',
		height: 'auto',
	}),
]);
