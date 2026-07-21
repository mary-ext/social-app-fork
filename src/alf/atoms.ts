import type { CSSProperties } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

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
} as const;
