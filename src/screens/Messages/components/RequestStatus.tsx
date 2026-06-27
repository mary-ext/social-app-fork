import { Pressable, View } from 'react-native';

import { HITSLOP_10 } from '#/lib/constants';

import { JOIN_REQUESTS_THRESHOLD } from '#/state/queries/messages/list-join-requests';

import { atoms as a, tokens, useTheme } from '#/alf';

import { Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon } from '#/components/icons/Envelope';
import { TimesLarge_Stroke2_Corner0_Rounded as CloseIcon } from '#/components/icons/Times';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function RequestStatus({
	top,
	count,
	onDismiss,
	onPress,
}: {
	top: number;
	count: number;
	onDismiss: () => void;
	onPress: () => void;
}) {
	const t = useTheme();

	return (
		<View
			style={[
				a.absolute,
				a.z_50,
				{
					top: top + tokens.space.xl,
					left: tokens.space.xl,
					right: tokens.space.xl,
				},
			]}
		>
			<View
				style={[
					{
						backgroundColor: t.palette.primary_50,
						borderWidth: 1,
						borderColor: t.palette.primary_100,
					},
					a.flex_1,
					a.rounded_full,
					a.flex_row,
					a.align_center,
				]}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={m['screens.messages.requests.viewIncoming.action']()}
					accessibilityHint={m['screens.messages.requests.viewIncoming.a11yJoin']()}
					hitSlop={HITSLOP_10}
					style={[a.flex_1, a.flex_row, a.align_center, a.p_lg]}
					onPress={onPress}
				>
					<EnvelopeIcon size="md" fill={colors.primary_500} />
					<Text style={[a.flex_1, a.ml_sm, a.text_sm, a.font_semi_bold, { color: t.palette.primary_500 }]}>
						{count > JOIN_REQUESTS_THRESHOLD
							? m['screens.messages.requests.newOverThreshold']({
									JOIN_REQUESTS_THRESHOLD,
								})
							: m['screens.messages.requests.newCount']({ count })}
					</Text>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={m['screens.messages.a11y.closeBanner']()}
					accessibilityHint={m['screens.messages.requests.closeBanner']()}
					hitSlop={HITSLOP_10}
					onPress={onDismiss}
					style={[a.p_lg]}
				>
					<CloseIcon size="md" fill={colors.primary_500} />
				</Pressable>
			</View>
		</View>
	);
}
