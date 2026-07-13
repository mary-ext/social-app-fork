import { type ViewProps, View } from 'react-native';

type KeyboardStickyViewProps = ViewProps & {
	enabled?: boolean;
	offset?: { opened?: number; closed?: number };
};

const DEFAULT_OFFSET: NonNullable<KeyboardStickyViewProps['offset']> = {};

// Vendored keyboard sticky view, converted to local animation helpers for
// `minimumOffset` clamping.
export function KeyboardStickyView({
	children,
	offset: { closed = 0 } = DEFAULT_OFFSET,
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
