import { style } from '@vanilla-extract/css';

/** Clips a descendant image carousel's horizontal overflow to the measured bleed width. */
export const clip = style({
	overflow: 'hidden',
});
