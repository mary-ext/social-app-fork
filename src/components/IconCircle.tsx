import type { CSSProperties } from 'react';
import { View } from 'react-native';

import { atoms as a, useTheme, type ViewStyleProp } from '#/alf';

import type { Props } from '#/components/icons/common';
import type { Growth_Stroke2_Corner0_Rounded as Growth } from '#/components/icons/Growth';

import { colors } from '#/styles/colors';

export function IconCircle({
	icon: Icon,
	size = 'xl',
	style,
	iconStyle,
}: ViewStyleProp & {
	icon: typeof Growth;
	size?: Props['size'];
	iconStyle?: CSSProperties;
}) {
	const t = useTheme();

	return (
		<View
			style={[
				a.justify_center,
				a.align_center,
				a.rounded_full,
				{
					width: size === 'lg' ? 52 : 64,
					height: size === 'lg' ? 52 : 64,
					backgroundColor: t.palette.primary_50,
				},
				style,
			]}
		>
			<Icon size={size} fill={colors.primary_500} style={iconStyle} />
		</View>
	);
}
