import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { useTitle } from '#/lib/hooks/useTitle';
import { useParams, useRoute } from '#/lib/router';

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
import { FollowingEndOfFeed } from '#/view/com/posts/FollowingEndOfFeed';

import { NoFeedsPinned } from '#/screens/Home/NoFeedsPinned';

import { type Section, Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useNavigate } from '#/routes';

// the feed-discovery tab nudging the user toward the Feeds screen, shown logged-out and when the only
// pinned feed is Following; selecting it opens that screen rather than switching feeds, so it has no
// panel of its own
const FEEDS_DISCOVERY_TAB = '__feeds__';

// registered for both Home and Start (a starter-pack deep link), so it reads the loose params/name.
export function HomeScreen() {
	const { data: preferences } = usePreferencesQuery();
	const { currentAccount } = useSession();
	const navigate = useNavigate();
	const { name: routeName } = useRoute();
	const params = useParams();
	const { data: pinnedFeedInfos, isLoading: isPinnedFeedsLoading } = usePinnedFeedsInfos();

	useEffect(() => {
		if (currentAccount && routeName === 'Start' && params.name && params.rkey) {
			navigate('StarterPack', { name: params.name as string, rkey: params.rkey as string });
		}
	}, [currentAccount, navigate, params, routeName]);

	if (preferences && pinnedFeedInfos && !isPinnedFeedsLoading) {
		return (
			<Layout.Screen noInsetTop={false}>
				<HomeScreenReady preferences={preferences} pinnedFeedInfos={pinnedFeedInfos} />
			</Layout.Screen>
		);
	} else {
		return (
			<Layout.Screen>
				<View style={styles.loading}>
					<ActivityIndicator size="large" />
				</View>
			</Layout.Screen>
		);
	}
}

const renderFollowingEmptyState = () => <FollowingEmptyState />;
const renderCustomFeedEmptyState = () => <CustomFeedEmptyState />;

function HomeScreenReady({
	preferences,
	pinnedFeedInfos,
}: {
	preferences: UsePreferencesQueryResponse;
	pinnedFeedInfos: SavedFeedSourceInfo[];
}) {
	const { hasSession } = useSession();
	const navigate = useNavigate();
	const setSelectedFeed = useSetSelectedFeed();

	const allFeeds = pinnedFeedInfos.map((f) => f.feedDescriptor);
	const selectedFeed = useSelectedFeed() ?? allFeeds[0];
	const selectedIndex = Math.max(0, allFeeds.indexOf(selectedFeed!));
	useTitle(pinnedFeedInfos[selectedIndex]?.displayName ?? m['common.nav.home']());

	const whatsHotFeed: FeedDescriptor = `feedgen|${PROD_DEFAULT_FEED('whats-hot')}`;

	let sections: Section<string>[];
	if (!hasSession) {
		sections = [
			{
				id: whatsHotFeed,
				label: 'Discover',
				children: (
					<FeedPage
						feed={whatsHotFeed}
						renderEmptyState={renderCustomFeedEmptyState}
						feedInfo={pinnedFeedInfos[0]!}
					/>
				),
			},
			{ id: FEEDS_DISCOVERY_TAB, label: 'Feeds ✨', children: null },
		];
	} else {
		const feedSections: Section<string>[] = pinnedFeedInfos.map((feedInfo) => {
			const feed = feedInfo.feedDescriptor;
			return {
				id: feed,
				label: feedInfo.displayName,
				children:
					feed === 'following' ? (
						<FeedPage
							feed={feed}
							renderEmptyState={renderFollowingEmptyState}
							renderEndOfFeed={FollowingEndOfFeed}
							feedInfo={feedInfo}
						/>
					) : (
						<FeedPage
							feed={feed}
							renderEmptyState={renderCustomFeedEmptyState}
							savedFeedConfig={feedInfo.savedFeed}
							feedInfo={feedInfo}
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

	const onValueChange = (value: string) => {
		if (value === FEEDS_DISCOVERY_TAB) {
			navigate('Feeds');
			return;
		}
		setSelectedFeed(value as FeedDescriptor);
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
			sections={sections}
			value={selectedFeed ?? sections[0]?.id ?? ''}
			onValueChange={onValueChange}
			onTabReselect={() => softReset.emit()}
			header={<HomeHeaderLayout />}
		/>
	);
}

const styles = StyleSheet.create({
	loading: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		paddingBottom: 100,
	},
});
