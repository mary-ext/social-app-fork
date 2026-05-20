import { type LayoutChangeEvent, type StyleProp, View, type ViewStyle } from 'react-native';

import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from '#/lib/animations/reanimatedCompat';

type AccordionAnimationProps = React.PropsWithChildren<{
	isExpanded: boolean;
	duration?: number;
	style?: StyleProp<ViewStyle>;
}>;

function WebAccordion({ isExpanded, duration = 300, style, children }: AccordionAnimationProps) {
	const heightValue = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => {
		const targetHeight = isExpanded ? heightValue.get() : 0;
		return {
			height: withTiming(targetHeight, {
				duration,
				easing: Easing.out(Easing.cubic),
			}),
			overflow: 'hidden',
		};
	});

	const onLayout = (e: LayoutChangeEvent) => {
		if (heightValue.get() === 0) {
			heightValue.set(e.nativeEvent.layout.height);
		}
	};

	return (
		<Animated.View style={[animatedStyle, style]}>
			<View onLayout={onLayout}>{children}</View>
		</Animated.View>
	);
}

export function AccordionAnimation(props: AccordionAnimationProps) {
	return <WebAccordion {...props} />;
}
