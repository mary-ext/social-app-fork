import { PROD_DEFAULT_FEED } from '#/lib/constants';

import { softReset } from '#/state/events';
import { setSelectedFeed, useSelectedFeed } from '#/state/preferences/selected-feed';
import { type SavedFeedSourceInfo, usePinnedFeedsInfos } from '#/state/queries/feed';
import type { FeedDescriptor } from '#/state/queries/post-feed';
import { usePreferencesQuery } from '#/state/queries/preferences';
import type { UsePreferencesQueryResponse } from '#/state/queries/preferences/types';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { CustomFeedEmptyState } from '#/screens/Home/components/CustomFeedEmptyState';
import { FeedPage } from '#/screens/Home/components/FeedPage';
import { FollowingEmptyState } from '#/screens/Home/components/FollowingEmptyState';
import { HomeHeaderLayout } from '#/screens/Home/components/HomeHeaderLayout';
import { NoFeedsPinned } from '#/screens/Home/components/NoFeedsPinned';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import type { Section } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

export function HomeScreen() {
	const { data: preferences } = usePreferencesQuery();
	const { data: pinnedFeedInfos } = usePinnedFeedsInfos();

	if (!preferences || !pinnedFeedInfos) {
		return (
			<Layout.Screen>
				<CenteredSpinner fill label={m['common.status.loading']()} size="_2xl" />
			</Layout.Screen>
		);
	}

	return (
		<Layout.Screen>
			<HomeScreenReady pinnedFeedInfos={pinnedFeedInfos} preferences={preferences} />
		</Layout.Screen>
	);
}

const renderFollowingEmptyState = () => <FollowingEmptyState />;
const renderCustomFeedEmptyState = () => <CustomFeedEmptyState />;

function HomeScreenReady({
	pinnedFeedInfos,
	preferences,
}: {
	pinnedFeedInfos: SavedFeedSourceInfo[];
	preferences: UsePreferencesQueryResponse;
}) {
	const { hasSession } = useSession();
	const selectedFeed = useSelectedFeed();

	const whatsHotFeed: FeedDescriptor = `feedgen|${PROD_DEFAULT_FEED('whats-hot')}`;

	let sections: Section<FeedDescriptor>[];
	if (!hasSession) {
		sections = [
			{
				id: whatsHotFeed,
				label: 'Discover',
				children: (
					<FeedPage
						feed={whatsHotFeed}
						feedInfo={pinnedFeedInfos[0]!}
						renderEmptyState={renderCustomFeedEmptyState}
					/>
				),
			},
		];
	} else {
		sections = pinnedFeedInfos.map((feedInfo) => {
			const feed = feedInfo.feedDescriptor;
			return {
				id: feed,
				label: feedInfo.displayName,
				children:
					feed === 'following' ? (
						<FeedPage
							key={feed}
							feed={feed}
							feedInfo={feedInfo}
							renderEmptyState={renderFollowingEmptyState}
						/>
					) : (
						<FeedPage
							key={feed}
							feed={feed}
							feedInfo={feedInfo}
							renderEmptyState={renderCustomFeedEmptyState}
							savedFeedConfig={feedInfo.savedFeed}
						/>
					),
			};
		});
	}

	const activeIndex = Math.max(
		0,
		sections.findIndex(({ id }) => id === selectedFeed),
	);
	const active = sections[activeIndex];
	const feeds = sections.map(({ id, label }) => ({ id, label }));
	useTitle(active?.label ?? m['common.nav.home']());

	const onSelectFeed = (feed: FeedDescriptor) => {
		window.scrollTo(0, 0);

		if (feed === active?.id) {
			softReset.emit();
			return;
		}

		setSelectedFeed(feed);
	};

	return (
		<>
			<HomeHeaderLayout activeFeed={feeds[activeIndex]} feeds={feeds} onSelectFeed={onSelectFeed} />
			{hasSession && pinnedFeedInfos.length === 0 ? (
				<NoFeedsPinned preferences={preferences} />
			) : (
				active?.children
			)}
		</>
	);
}
