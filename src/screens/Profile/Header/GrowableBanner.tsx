import { Pressable, View } from 'react-native';

import { atoms as a } from '#/alf';

export function GrowableBanner({
	backButton,
	children,
	label,
	onPress,
	testID,
}: {
	backButton?: React.ReactNode;
	children: React.ReactNode;
	label?: string;
	onPress?: () => void;
	testID?: string;
}) {
	return (
		<Pressable
			testID={testID}
			onPress={onPress}
			accessibilityRole="image"
			accessibilityLabel={label}
			accessibilityHint=""
			style={[a.w_full, a.h_full]}
		>
			<View style={[a.w_full, a.h_full]}>{children}</View>
			{backButton}
		</Pressable>
	);
}
