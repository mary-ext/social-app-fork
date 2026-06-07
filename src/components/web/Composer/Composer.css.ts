import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontFamily, fontSize, lineHeight } from '#/styles/tokens.css';

// shared metrics so the transparent textarea and the colored preview overlay wrap + advance identically.
const textMetrics = {
	fontFamily,
	fontSize: fontSize.lg,
	letterSpacing: 'normal',
	lineHeight: lineHeight.snug,
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
} as const;

export const root = style({
	position: 'relative',
});

// clips the scroll-synced preview to the editor box.
export const overlay = style({
	inset: 0,
	overflow: 'hidden',
	pointerEvents: 'none',
	position: 'absolute',
	zIndex: 10,
});

// padding is applied inline (it varies per instance) so it matches the textarea exactly.
export const overlayInner = style({
	...textMetrics,
	color: vars.palette.contrast_1000,
	left: 0,
	position: 'absolute',
	right: 0,
});

export const facet = style({
	color: vars.palette.primary_500,
});

export const textarea = style({
	...textMetrics,
	appearance: 'none',
	background: 'transparent',
	border: 0,
	// so the `minHeight` calc (content + padding) matches the rendered height, like the RNW textarea
	boxSizing: 'border-box',
	// the preview owns the visible glyphs; the textarea contributes only the caret + selection.
	caretColor: vars.palette.contrast_1000,
	color: 'transparent',
	display: 'block',
	margin: 0,
	outline: 'none',
	overflowY: 'hidden',
	overscrollBehavior: 'none',
	position: 'relative',
	resize: 'none',
	scrollbarColor: `${vars.palette.contrast_200} transparent`,
	scrollbarWidth: 'thin',
	width: '100%',
	zIndex: 20,
	selectors: {
		'&::placeholder': { color: vars.palette.contrast_500, opacity: 1 },
	},
});
