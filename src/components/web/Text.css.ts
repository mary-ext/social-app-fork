import { createVar, style, styleVariants } from '@vanilla-extract/css';

const FONT_FAMILY = `InterVariable, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;

export const base = style({
	fontFamily: FONT_FAMILY,
	margin: 0,
	padding: 0,
});

/** Set per-instance via `assignInlineVars` — the only value that can't be known at build time. */
export const lineClampVar = createVar();

export const clamp = style({
	display: '-webkit-box',
	overflow: 'hidden',
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: lineClampVar,
});

export const userSelect = styleVariants({
	none: { userSelect: 'none' },
	text: { userSelect: 'text' },
});
