import { useCallback } from 'react';
import { View } from 'react-native';
import * as TID from '@atcute/tid';

import { DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED } from '#/lib/constants';

import {
	useOverwriteSavedFeedsMutation,
	type UsePreferencesQueryResponse,
} from '#/state/queries/preferences';

import { CenteredView } from '#/view/com/util/Views';

import { atoms as a } from '#/alf';

import { ListSparkle_Stroke2_Corner0_Rounded as ListSparkle } from '#/components/icons/ListSparkle';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Typography';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

export function NoFeedsPinned({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { isPending, mutateAsync: overwriteSavedFeeds } = useOverwriteSavedFeedsMutation();

	const addRecommendedFeeds = useCallback(async () => {
		let skippedTimeline = false;
		let skippedDiscover = false;
		let remainingSavedFeeds = [];

		// remove first instance of both timeline and discover, since we're going to overwrite them
		for (const savedFeed of preferences.savedFeeds) {
			if (savedFeed.type === 'timeline' && !skippedTimeline) {
				skippedTimeline = true;
			} else if (savedFeed.value === DISCOVER_SAVED_FEED.value && !skippedDiscover) {
				skippedDiscover = true;
			} else {
				remainingSavedFeeds.push(savedFeed);
			}
		}

		const toSave = [
			{
				...DISCOVER_SAVED_FEED,
				pinned: true,
				id: TID.now(),
			},
			{
				...TIMELINE_SAVED_FEED,
				pinned: true,
				id: TID.now(),
			},
			...remainingSavedFeeds,
		];

		await overwriteSavedFeeds(toSave);
	}, [overwriteSavedFeeds, preferences.savedFeeds]);

	return (
		<CenteredView sideBorders style={[a.h_full_vh]}>
			<View style={[a.align_center, a.h_full_vh, a.py_3xl, a.px_xl]}>
				<View style={[a.align_center, a.gap_sm, a.pb_xl]}>
					<Text style={[a.text_xl, a.font_semi_bold]}>{m['common.error.whoops']()}</Text>
					<Text style={[a.text_md, a.text_center, a.leading_snug, { maxWidth: 340 }]}>
						{m['screens.home.empty']()}
					</Text>
				</View>

				<View style={[a.flex_row, a.gap_md, a.justify_center, a.flex_wrap]}>
					<Button
						disabled={isPending}
						label={m['common.feeds.action.applyRecommended']()}
						size="large"
						variant="solid"
						color="primary"
						onClick={() => void addRecommendedFeeds()}
					>
						<ButtonIcon icon={Plus} />
						<ButtonText>{m['screens.home.action.addRecommendedFeeds']()}</ButtonText>
					</Button>

					<LinkButton
						label={m['screens.home.action.browseOtherFeeds']()}
						to="/feeds"
						size="large"
						variant="solid"
						color="secondary"
					>
						<ButtonIcon icon={ListSparkle} />
						<ButtonText>{m['screens.home.action.browseOtherFeeds']()}</ButtonText>
					</LinkButton>
				</View>
			</View>
		</CenteredView>
	);
}
