import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize, lineHeight } from '#/styles/tokens.css';

// layered on top of the web Button `bare`/`small` recipe: just the language-specific color + the pulse
// anchoring. padding (8/14), the focus ring, reset, and ref forwarding all come from the Button.
export const button = style({
	color: vars.palette.primary_500,
	// own stacking context so the pulse overlay's negative z-index lands behind the label but above the
	// button background, rather than escaping to an ancestor context
	isolation: 'isolate',
	marginRight: 4,
	// clips + anchors the nudge pulse overlay
	overflow: 'hidden',
	position: 'relative',
	selectors: {
		'&:hover': { color: vars.palette.primary_300 },
		'&:active': { color: vars.palette.primary_300 },
	},
});

export const langText = style({
	color: 'inherit',
	fontSize: fontSize.sm,
	fontWeight: 600,
	lineHeight: lineHeight.snug,
	maxWidth: 100,
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

// two ease-in-out fade pulses (≈300ms in / 500ms out, twice) to hint at the language suggestion.
const pulse = keyframes({
	'0%': { opacity: 0 },
	'18.75%': { opacity: 1 },
	'50%': { opacity: 0 },
	'68.75%': { opacity: 1 },
	'100%': { opacity: 0 },
});

export const pulseOverlay = style({
	animationDuration: '1600ms',
	animationName: pulse,
	animationTimingFunction: 'ease-in-out',
	backgroundColor: vars.palette.contrast_50,
	inset: 0,
	// the keyframes both start and end at opacity 0; without a matching base the
	// element snaps back to the default opacity 1 once the animation completes,
	// leaving the overlay stuck fully visible over the button.
	opacity: 0,
	pointerEvents: 'none',
	position: 'absolute',
	// sit behind the label/globe (which are in-flow): the pulse flashes around them, not over them
	zIndex: -1,
});
