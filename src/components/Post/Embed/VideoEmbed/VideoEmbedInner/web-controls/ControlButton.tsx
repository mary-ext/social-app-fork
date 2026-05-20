import { type ViewStyle } from 'react-native';
import { type SvgProps } from 'react-native-svg';

import { PressableWithHover } from '#/view/com/util/PressableWithHover';

import { atoms as a, useTheme } from '#/alf';

type WebViewStyle = ViewStyle & {
	transition?: string;
};

const webViewStyle = (style: WebViewStyle): ViewStyle => {
	return style as unknown as ViewStyle;
};

export function ControlButton({
	active,
	activeLabel,
	inactiveLabel,
	activeIcon: ActiveIcon,
	inactiveIcon: InactiveIcon,
	onPress,
}: {
	active: boolean;
	activeLabel: string;
	inactiveLabel: string;
	activeIcon: React.ComponentType<Pick<SvgProps, 'fill' | 'width'>>;
	inactiveIcon: React.ComponentType<Pick<SvgProps, 'fill' | 'width'>>;
	onPress: () => void;
}) {
	const t = useTheme();
	return (
		<PressableWithHover
			accessibilityRole="button"
			accessibilityLabel={active ? activeLabel : inactiveLabel}
			accessibilityHint=""
			onPress={onPress}
			style={[a.p_xs, a.rounded_full, webViewStyle({ transition: 'background-color 0.1s' })]}
			hoverStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
		>
			{active ? (
				<ActiveIcon fill={t.palette.white} width={20} aria-hidden />
			) : (
				<InactiveIcon fill={t.palette.white} width={20} aria-hidden />
			)}
		</PressableWithHover>
	);
}
