import Animated, { useAnimatedStyle } from '#/lib/animations/reanimatedCompat';

import {
	type KeyboardStickyViewProps,
	useReanimatedKeyboardAnimation,
} from '#/shims/native-keyboard-controller';

// Vendored keyboard sticky view, converted to local animation helpers for
// `minimumOffset` clamping.
export function KeyboardStickyView({
	children,
	offset: { closed = 0, opened = 0 } = {},
	style,
	enabled = true,
	minimumOffset,
	...props
}: KeyboardStickyViewProps & {
	/** Stop the stickyview going lower than this (i.e. bottom safe area) */
	minimumOffset?: number;
}) {
	const { height, progress } = useReanimatedKeyboardAnimation();

	const animatedStyle = useAnimatedStyle(() => {
		const offset = closed + (opened - closed) * progress.get();
		let translateY: number;

		if (enabled) {
			let h = height.get();
			if (minimumOffset != null) {
				h = Math.min(h, -minimumOffset);
			}
			translateY = h + offset;
		} else {
			translateY = closed;
		}

		return {
			transform: [{ translateY }],
		};
	});

	return (
		<Animated.View style={[animatedStyle, style]} {...props}>
			{children}
		</Animated.View>
	);
}
