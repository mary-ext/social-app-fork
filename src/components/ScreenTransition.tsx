import { type StyleProp, type ViewStyle } from 'react-native';

import Animated, { FadeIn, FadeOut } from '#/lib/animations/reanimatedCompat';

export function ScreenTransition({
	style,
	children,
	enabledWeb,
}: {
	direction: 'Backward' | 'Forward';
	style?: StyleProp<ViewStyle>;
	children: React.ReactNode;
	enabledWeb?: boolean;
}) {
	const webEntering = enabledWeb ? FadeIn.duration(90) : undefined;
	const webExiting = enabledWeb ? FadeOut.duration(90) : undefined;

	return (
		<Animated.View entering={webEntering} exiting={webExiting} style={style}>
			{children}
		</Animated.View>
	);
}
