import type { GlobalStyleRule } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { zIndex } from '#/styles/tokens.css';

/**
 * styles a dialog body's pseudo-element as a divider, visible when more content lies past the edge.
 *
 * @param edge the edge the divider sticks to
 * @returns the pseudo-element's styles
 */
export const getScrollDivider = (edge: 'bottom' | 'top'): GlobalStyleRule => {
	// cancel out its height to avoid layout shifts.
	const placement = edge === 'top' ? { top: 0, marginBottom: -1 } : { bottom: 0, marginTop: -1 };

	return {
		display: 'block',
		position: 'sticky',
		...placement,
		flexShrink: 0,
		zIndex: zIndex.raised,
		transitionDuration: '150ms',
		transitionProperty: 'opacity',
		opacity: 0,
		backgroundColor: colors.contrast_200,
		height: 1,
		pointerEvents: 'none',
		content: '""',
		'@container': {
			[`scroll-state(scrollable: ${edge})`]: {
				opacity: 1,
			},
		},
	};
};
