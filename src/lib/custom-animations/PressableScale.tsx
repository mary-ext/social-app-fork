import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

export function PressableScale({
	targetScale: _targetScale,
	children,
	style,
	onPressIn,
	onPressOut,
	...rest
}: {
	targetScale?: number;
	style?: StyleProp<ViewStyle>;
} & Exclude<PressableProps, 'onPressIn' | 'onPressOut' | 'style'>) {
	return (
		<Pressable
			accessibilityRole="button"
			onPressIn={(e) => {
				if (onPressIn) {
					onPressIn(e);
				}
			}}
			onPressOut={(e) => {
				if (onPressOut) {
					onPressOut(e);
				}
			}}
			style={style}
			{...rest}
		>
			{children}
		</Pressable>
	);
}
