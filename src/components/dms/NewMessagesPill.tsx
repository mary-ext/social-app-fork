import { Pressable, View } from 'react-native';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';

import { atoms as a, useTheme } from '#/alf';

import { ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon } from '#/components/icons/Arrow';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function NewMessagesPill({ onPress: onPressInner }: { onPress: () => void }) {
	const t = useTheme();
	const { bottom: bottomInset } = useSafeAreaInsets();

	const onPress = () => {
		onPressInner?.();
	};

	return (
		<View
			style={[
				a.absolute,
				a.w_full,
				a.z_10,
				a.align_center,
				{
					bottom: bottomInset + 70,
					// Don't prevent scrolling in this area _except_ for in the pill itself
					pointerEvents: 'box-none',
				},
			]}
		>
			<Pressable
				style={[
					a.align_center,
					a.justify_center,
					a.rounded_full,
					a.shadow_sm,
					a.border,
					t.atoms.bg,
					t.atoms.border_contrast_low,
					{
						height: 40,
						width: 40,
						alignItems: 'center',
						pointerEvents: 'box-only',
					},
				]}
				accessibilityRole="button"
				accessibilityLabel={m['components.dms.scrollDown.a11y.label']()}
				accessibilityHint={m['components.dms.scrollDown.a11y.hint']()}
				onPress={onPress}
			>
				<ArrowDownIcon size="lg" fill={colors.text} />
			</Pressable>
		</View>
	);
}
