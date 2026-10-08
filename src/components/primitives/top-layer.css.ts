import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

/** resets native popover and dialog styles. */
export const topLayerReset = style(
	layered(reset, {
		margin: 0,
		border: 0,
		background: 'none',
		padding: 0,
		maxWidth: 'none',
		maxHeight: 'none',
		color: 'inherit',
		cursor: 'auto',
		// pointer-events still inherits from the DOM host in the top layer.
		pointerEvents: 'auto',
		'::backdrop': {
			background: 'none',
		},
	}),
);
