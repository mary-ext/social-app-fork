import { View } from 'react-native';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

/**
 * banner shown when the user has no saved feeds of any type, offering to apply the recommended set. present
 * this only if the user has no other saved feeds.
 *
 * @param disabled disables the apply button, e.g. while a save is in flight
 * @param onAddRecommendedFeeds invoked when the user applies the recommended feeds; the caller decides
 *   whether that persists immediately or stages into an unsaved draft
 */
export function NoSavedFeedsOfAnyType({
	disabled,
	onAddRecommendedFeeds,
}: {
	disabled?: boolean;
	onAddRecommendedFeeds: () => void;
}) {
	const t = useTheme();

	return (
		<View style={[a.flex_row, a.flex_wrap, a.justify_between, a.p_xl, a.gap_md]}>
			<Text style={[a.leading_snug, t.atoms.text_contrast_medium, { maxWidth: 310 }]}>
				{m['screens.feeds.noSaved']()}
			</Text>
			<Button
				disabled={disabled}
				label={m['common.feeds.action.applyRecommended']()}
				size="small"
				color="primary_subtle"
				onPress={onAddRecommendedFeeds}
			>
				<ButtonIcon icon={Plus} />
				<ButtonText>{m['screens.feeds.action.useRecommended']()}</ButtonText>
			</Button>
		</View>
	);
}
