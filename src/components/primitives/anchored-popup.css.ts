import { globalStyle, style } from '@vanilla-extract/css';

import { topLayerReset } from './top-layer.css';

// popup styles use @starting-style for entry and [data-closed] for exit; presence waits for transitions.

export const positioner = style([
	topLayerReset,
	{
		containerType: 'anchored',
		positionVisibility: 'anchors-visible',
		overflow: 'visible',
		inset: 'auto',
	},
]);

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
		['top', 'bottom', 'top', 'flip-block'],
		['bottom', 'top', 'bottom', 'flip-block'],
		['left', 'right', 'left', 'flip-inline'],
		['right', 'left', 'right', 'flip-inline'],
	] as const;

	// x-axis start/end spans reverse in RTL.
	const aligns = [
		['center', 'center', 'center', 'center'],
		['start', 'left', 'right', 'top'],
		['end', 'right', 'left', 'bottom'],
	] as const;

	for (const [side, origin, flippedOrigin, fallback] of sides) {
		const vertical = side === 'top' || side === 'bottom';
		const setOrigin = (selector: string, cross: string): void => {
			const toOrigin = (edge: string): string => {
				return vertical ? `${cross} ${edge}` : `${edge} ${cross}`;
			};

			globalStyle(selector, {
				vars: { '--transform-origin': toOrigin(origin) },
				'@container': {
					[`anchored(fallback: ${fallback})`]: {
						vars: { '--transform-origin': toOrigin(flippedOrigin) },
					},
				},
			});
		};

		for (const [align, ltrCross, rtlCross, horizontalCross] of aligns) {
			const selector = `${positioner}[data-side='${side}'][data-align='${align}'] > *`;
			setOrigin(selector, vertical ? ltrCross : horizontalCross);
			if (vertical && ltrCross !== rtlCross) {
				setOrigin(`${selector}:dir(rtl)`, rtlCross);
			}
		}
	}
}
