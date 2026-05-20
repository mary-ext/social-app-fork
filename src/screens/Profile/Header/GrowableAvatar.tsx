import { type StyleProp, View, type ViewStyle } from 'react-native';

export function GrowableAvatar({
	children,
	style,
}: {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}) {
	return <View style={style}>{children}</View>;
}
