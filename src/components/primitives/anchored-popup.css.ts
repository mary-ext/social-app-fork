import { globalStyle, style } from '@vanilla-extract/css';

// popup styles use @starting-style for entry and [data-closed] for exit; presence waits for transitions.

// reset the browser's popover styles; the popup owns its appearance.
export const positioner = style({
	containerType: 'anchored',
	positionVisibility: 'anchors-visible',
	overflow: 'visible',
	inset: 'auto',
	margin: 0,
	border: 0,
	background: 'none',
	padding: 0,
	color: 'inherit',
});

export const shrinkingPositioner = style({
	display: 'flex',
	flexDirection: 'column',
});

// flex items otherwise retain their content's minimum height.
globalStyle(`${shrinkingPositioner} > *`, {
	minHeight: 0,
});

// fallback queries only style descendants, so --transform-origin is set on the popup, toward the anchor.
// browsers without anchored queries retain the preferred side's origin.
{
	// [side, origin, origin once flipped, fallback]
	const sides = [
		['top', 'center bottom', 'center top', 'flip-block'],
		['bottom', 'center top', 'center bottom', 'flip-block'],
		['left', 'right center', 'left center', 'flip-inline'],
		['right', 'left center', 'right center', 'flip-inline'],
	] as const;

	for (const [side, origin, flippedOrigin, fallback] of sides) {
		globalStyle(`${positioner}[data-side='${side}'] > *`, {
			vars: { '--transform-origin': origin },
			'@container': {
				[`anchored(fallback: ${fallback})`]: { vars: { '--transform-origin': flippedOrigin } },
			},
		});
	}
}
