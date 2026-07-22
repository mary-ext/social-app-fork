import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { useTitle } from '#/lib/hooks/useTitle';

import { softReset } from '#/state/events';
import { type SavedFeedSourceInfo, usePinnedFeedsInfos } from '#/state/queries/feed';
import type { FeedDescriptor } from '#/state/queries/post-feed';
import { usePreferencesQuery } from '#/state/queries/preferences';
import type { UsePreferencesQueryResponse } from '#/state/queries/preferences/types';
import { useSession } from '#/state/session';
import { useSelectedFeed, useSetSelectedFeed } from '#/state/shell/selected-feed';

import { FeedPage } from '#/view/com/feeds/FeedPage';
import { HomeHeaderLayout } from '#/view/com/home/HomeHeaderLayout';
import { CustomFeedEmptyState } from '#/view/com/posts/CustomFeedEmptyState';
import { FollowingEmptyState } from '#/view/com/posts/FollowingEmptyState';

import { NoFeedsPinned } from '#/screens/Home/NoFeedsPinned';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { type Section, Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useNavigate } from '#/routes';

const FEEDS_DISCOVERY_TAB = '__feeds__';

type HomeTabId = FeedDescriptor | typeof FEEDS_DISCOVERY_TAB;

export function HomeScreen() {
	const { data: preferences } = usePreferencesQuery();
	const { data: pinnedFeedInfos } = usePinnedFeedsInfos();

	if (!preferences || !pinnedFeedInfos) {
		return (
			<Layout.Screen>
				<CenteredSpinner fill label={m['common.status.loading']()} size="2xl" />
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
	const navigate = useNavigate();
	const setSelectedFeed = useSetSelectedFeed();

	const allFeeds = pinnedFeedInfos.map((f) => f.feedDescriptor);
	const selectedFeed = useSelectedFeed() ?? allFeeds[0];
	const selectedIndex = Math.max(0, allFeeds.indexOf(selectedFeed!));
	useTitle(pinnedFeedInfos[selectedIndex]?.displayName ?? m['common.nav.home']());

	const whatsHotFeed: FeedDescriptor = `feedgen|${PROD_DEFAULT_FEED('whats-hot')}`;

	let sections: Section<HomeTabId>[];
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
			{ id: FEEDS_DISCOVERY_TAB, label: 'Feeds ✨', children: null },
		];
	} else {
		const feedSections: Section<HomeTabId>[] = pinnedFeedInfos.map((feedInfo) => {
			const feed = feedInfo.feedDescriptor;
			return {
				id: feed,
				label: feedInfo.displayName,
				children:
					feed === 'following' ? (
						<FeedPage feed={feed} feedInfo={feedInfo} renderEmptyState={renderFollowingEmptyState} />
					) : (
						<FeedPage
							feed={feed}
							feedInfo={feedInfo}
							renderEmptyState={renderCustomFeedEmptyState}
							savedFeedConfig={feedInfo.savedFeed}
						/>
					),
			};
		});

		// nudge feed discovery when the user has only the Following feed pinned
		const hasPinnedCustom = pinnedFeedInfos.some((f) => f.feedDescriptor !== 'following');
		if (!hasPinnedCustom) {
			feedSections.push({ id: FEEDS_DISCOVERY_TAB, label: 'Feeds ✨', children: null });
		}
		sections = feedSections;
	}

	const onValueChange = (value: HomeTabId) => {
		if (value === FEEDS_DISCOVERY_TAB) {
			navigate('Feeds');
			return;
		}
		setSelectedFeed(value);
	};

	if (hasSession && pinnedFeedInfos.length === 0) {
		return (
			<>
				<HomeHeaderLayout />
				<NoFeedsPinned preferences={preferences} />
			</>
		);
	}

	return (
		<Tabs
			header={<HomeHeaderLayout />}
			onTabReselect={() => softReset.emit()}
			onValueChange={onValueChange}
			sections={sections}
			value={selectedFeed ?? sections[0]?.id ?? FEEDS_DISCOVERY_TAB}
		/>
	);
}
