import { globalStyle, style } from '@vanilla-extract/css';

import { navHost } from '#/components/ImageEmbed/carousel/PagingControls.css';
import * as strip from '#/components/ImageEmbed/carousel/strip.css';
import { insetLeftVar, insetRightVar } from '#/components/images/Gallery/index.css';

import { vars } from '#/styles/contract.css';

import { MEDIA_DRAGGING_ATTR } from '../shared/elements';
import { RAIL_WIDTH, RIGHT_PADDING } from '../shared/layout';
import { FOCUS_RING_EXTENT } from './MediaTile.css';

export const single = style({
	display: 'flex',
	position: 'relative',
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

export const stripScroll = style([
	strip.scroll,
	{
		position: 'relative',
		marginBlock: -FOCUS_RING_EXTENT,
		boxSizing: 'content-box',
		paddingBlock: FOCUS_RING_EXTENT,
	},
]);

// mandatory snapping would undo drag auto-scrolling.
globalStyle(`[${MEDIA_DRAGGING_ATTR}] ${stripScroll}`, {
	scrollSnapType: 'none',
});

/** thickness of the insertion line, in pixels. */
export const DROP_LINE_THICKNESS = 3;

export const dropLine = style({
	position: 'absolute',
	zIndex: 1,
	borderRadius: DROP_LINE_THICKNESS,
	backgroundColor: vars.palette.primary_500,
	pointerEvents: 'none',
});

// position paging buttons relative to the strip root.
export const paging = style({
	display: 'contents',
});
