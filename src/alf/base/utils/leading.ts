import type { TextStyle } from 'react-native';

import * as tokens from '../tokens';

/**
 * Util to calculate lineHeight from a text size atom and a leading atom (which are unitless). On native, this
 * will evaluate to a rounded pixel value. On web, it will be a unitless string.
 *
 * Example: `leading({ fontSize: 15, lineHeight: 1.2 })` // => { lineHeight: 17 }
 */
export function leading(textStyle: TextStyle): Pick<TextStyle, 'lineHeight'> {
	const lineHeight = textStyle?.lineHeight || tokens.lineHeight.snug;

	return {
		lineHeight: String(lineHeight) as unknown as TextStyle['lineHeight'],
	};
}
