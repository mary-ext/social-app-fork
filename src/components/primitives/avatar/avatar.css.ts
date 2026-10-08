import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

// keep unloaded images in layout so lazy loading can start.
export const image = style(
	layered(reset, {
		selectors: {
			'&:is([data-loading], [data-error])': { visibility: 'hidden' },
		},
	}),
);
