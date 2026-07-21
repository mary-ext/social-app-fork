import type { CSSProperties } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { atoms as baseAtoms } from '#/alf/base';

type WebAtomStyle = CSSProperties & ImageStyle & TextStyle & ViewStyle;

// atoms are typed as RN styles for components that still take `StyleProp`, so web-only rules have to be
// re-branded on the way in; the RNW renderer forwards whatever CSS it is given
const webStyle = (style: CSSProperties): WebAtomStyle => {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
	return style as unknown as WebAtomStyle;
};

export const atoms = {
	...baseAtoms,

	h_full_vh: webStyle({
		height: '100vh',
	}),

	/** Used for the outermost components on screens, to ensure that they can fill the screen and extend beyond. */
	util_screen_outer: webStyle({
		minHeight: '100dvh',
	}),

	/*
	 * Theme-independent bg colors
	 */
	bg_transparent: {
		backgroundColor: 'transparent',
	},

	/** Aspect ratios */
	aspect_square: {
		aspectRatio: 1,
	},
	aspect_card: {
		aspectRatio: CARD_ASPECT_RATIO,
	},

	/*
	 * Transition
	 */
	transition_none: webStyle({
		transitionProperty: 'none',
	}),
	transition_timing_default: webStyle({
		transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
		transitionDuration: '100ms',
	}),
	transition_all: webStyle({
		transitionProperty: 'all',
		transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
		transitionDuration: '100ms',
	}),
	transition_color: webStyle({
		transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
		transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
		transitionDuration: '100ms',
	}),
	transition_opacity: webStyle({
		transitionProperty: 'opacity',
		transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
		transitionDuration: '100ms',
	}),
	transition_transform: webStyle({
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
		transitionDuration: '100ms',
	}),
	transition_delay_50ms: webStyle({
		transitionDelay: '50ms',
	}),

	/**
	 * Visually hidden but available to screen readers (web). Use for live regions or off-screen labels (e.g.
	 * "Image 1 of 3").
	 */
	sr_only: webStyle({
		position: 'absolute',
		width: 1,
		height: 1,
		padding: 0,
		margin: -1,
		overflow: 'hidden',
		clip: 'rect(0,0,0,0)',
		whiteSpace: 'nowrap',
		borderWidth: 0,
	}),
} as const;
