import { type StyleProp, View, type ViewStyle } from 'react-native';

export function ScreenTransition({
	style,
	children,
}: {
	direction: 'Backward' | 'Forward';
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
	enabledWeb?: boolean;
}) {
	return <View style={style}>{children}</View>;
}
