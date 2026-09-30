import { style } from '@vanilla-extract/css';

import { navHost } from '#/components/ImageEmbed/carousel/PagingControls.css';
import * as strip from '#/components/ImageEmbed/carousel/strip.css';
import { insetLeftVar, insetRightVar } from '#/components/images/Gallery/index.css';

import { space } from '#/styles/tokens.css';

import { RAIL_WIDTH, RIGHT_PADDING } from '../layout';

export const grid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
	gap: space.xs,
});

export const single = style({
	display: 'flex',
});

export const stripRoot = style([
	navHost,
	strip.root,
	{
		vars: {
			// extend the strip across the rail and right padding.
			[insetLeftVar]: `${RAIL_WIDTH}px`,
			[insetRightVar]: `${RIGHT_PADDING}px`,
		},
	},
]);

export const stripScroll = style([strip.scroll, { position: 'relative' }]);

// position paging buttons relative to the strip root.
export const paging = style({
	display: 'contents',
});
