import { style } from '@vanilla-extract/css';

import { layered } from '#/styles/layers';
import { reset } from '#/styles/layers.css';

export const input = style(
	layered(reset, {
		selectors: {
			// avoid a second reveal button in Edge.
			'&::-ms-reveal': { display: 'none' },
		},
	}),
);
