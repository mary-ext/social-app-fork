import { View } from 'react-native';

import type { KeyboardStickyViewProps } from '#/shims/native-keyboard-controller';

// Vendored keyboard sticky view, converted to local animation helpers for
// `minimumOffset` clamping.
export function KeyboardStickyView({
	children,
	offset: { closed = 0 } = {},
	style,
	enabled = true,
	minimumOffset,
	...props
}: KeyboardStickyViewProps & {
	/** Stop the stickyview going lower than this (i.e. bottom safe area) */
	minimumOffset?: number;
}) {
	const translateY = enabled && minimumOffset != null ? closed - Math.max(0, minimumOffset) : closed;

	return (
		<View style={[{ transform: [{ translateY }] }, style]} {...props}>
			{children}
		</View>
	);
}
