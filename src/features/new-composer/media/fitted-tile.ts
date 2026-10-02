import type { StyleRule } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { borderRadius } from '#/styles/tokens.css';

/**
 * sizes a tile to an aspect ratio within the feed's height limit.
 *
 * @param ratio a CSS width-to-height ratio or variable reference
 * @returns the tile's styles
 */
export const getFittedStyle = (ratio: string): StyleRule => ({
	borderRadius: borderRadius.md,
	aspectRatio: ratio,
	width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratio}))`,
});
