import { View } from 'react-native';
import * as TID from '@atcute/tid';

import { RECOMMENDED_SAVED_FEEDS } from '#/lib/constants';

import { useOverwriteSavedFeedsMutation } from '#/state/queries/preferences';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

/**
 * Explicitly named, since the CTA in this component will overwrite all saved feeds if pressed. It should only
 * be presented to the user if they actually have no other feeds saved.
 */
export function NoSavedFeedsOfAnyType({ onAddRecommendedFeeds }: { onAddRecommendedFeeds?: () => void }) {
	const t = useTheme();
	const { isPending, mutateAsync: overwriteSavedFeeds } = useOverwriteSavedFeedsMutation();

	const addRecommendedFeeds = async () => {
		onAddRecommendedFeeds?.();
		await overwriteSavedFeeds(
			RECOMMENDED_SAVED_FEEDS.map((f) => ({
				...f,
				id: TID.now(),
			})),
		);
	};

	return (
		<View style={[a.flex_row, a.flex_wrap, a.justify_between, a.p_xl, a.gap_md]}>
			<Text style={[a.leading_snug, t.atoms.text_contrast_medium, { maxWidth: 310 }]}>
				{m['screens.feeds.noSaved']()}
			</Text>
			<Button
				disabled={isPending}
				label={m['common.feeds.action.applyRecommended']()}
				size="small"
				color="primary_subtle"
				onPress={() => void addRecommendedFeeds()}
			>
				<ButtonIcon icon={Plus} />
				<ButtonText>{m['screens.feeds.action.useRecommended']()}</ButtonText>
			</Button>
		</View>
	);
}
