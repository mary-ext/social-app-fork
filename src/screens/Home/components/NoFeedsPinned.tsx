import * as TID from '@atcute/tid';

import { DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED } from '#/lib/constants';

import {
	type UsePreferencesQueryResponse,
	useOverwriteSavedFeedsMutation,
} from '#/state/queries/preferences';

import { ListSparkle_Stroke2_Corner0_Rounded as ListSparkle } from '#/components/icons/ListSparkle';
import { PlusLarge_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './NoFeedsPinned.css';
export function NoFeedsPinned({ preferences }: { preferences: UsePreferencesQueryResponse }) {
	const { isPending, mutateAsync: overwriteSavedFeeds } = useOverwriteSavedFeedsMutation();

	const addRecommendedFeeds = async () => {
		let skippedTimeline = false;
		let skippedDiscover = false;
		const remainingSavedFeeds = [];

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
				id: TID.now(),
				pinned: true,
			},
			{
				...TIMELINE_SAVED_FEED,
				id: TID.now(),
				pinned: true,
			},
			...remainingSavedFeeds,
		];

		await overwriteSavedFeeds(toSave);
	};

	return (
		<div className={css.container}>
			<div className={css.header}>
				<Text size="xl" weight="semiBold">
					{m['common.error.whoops']()}
				</Text>
				<Text align="center" className={css.description}>
					{m['screens.home.empty']()}
				</Text>
			</div>

			<div className={css.actions}>
				<Button
					color="primary"
					disabled={isPending}
					label={m['common.feeds.action.applyRecommended']()}
					onClick={() => void addRecommendedFeeds()}
					size="large"
					variant="solid"
				>
					<ButtonIcon icon={Plus} />
					<ButtonText>{m['screens.home.action.addRecommendedFeeds']()}</ButtonText>
				</Button>

				<LinkButton
					color="secondary"
					label={m['screens.home.action.browseOtherFeeds']()}
					size="large"
					to="/feeds"
					variant="solid"
				>
					<ButtonIcon icon={ListSparkle} />
					<ButtonText>{m['screens.home.action.browseOtherFeeds']()}</ButtonText>
				</LinkButton>
			</div>
		</div>
	);
}
