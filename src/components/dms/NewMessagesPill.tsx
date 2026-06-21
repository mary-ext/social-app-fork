import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useLingui } from '@lingui/react/macro';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';

import { atoms as a, useTheme } from '#/alf';

import { ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon } from '#/components/icons/Arrow';

import { colors } from '#/styles/colors';

export function NewMessagesPill({ onPress: onPressInner }: { onPress: () => void }) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { bottom: bottomInset } = useSafeAreaInsets();

	const onPress = useCallback(() => {
		onPressInner?.();
	}, [onPressInner]);

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
				accessibilityLabel={l`Scroll to latest messages`}
				accessibilityHint={l`Scrolls the conversation to the most recent message`}
				onPress={onPress}
			>
				<ArrowDownIcon size="md" fill={colors.text} />
			</Pressable>
		</View>
	);
}
