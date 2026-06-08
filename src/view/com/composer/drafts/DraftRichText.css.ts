import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

// the draft card owns the press; the preview text is purely visual.
export const root = style({
	pointerEvents: 'none',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
});

export const facet = style({
	color: vars.palette.primary_500,
});

// mirrors RichText's emoji-only enlargement (its default `emojiMultiplier`).
export const emoji = style({
	fontSize: `calc(${fontSize.md} * 1.85)`,
});
