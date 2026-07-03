import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { PROD_DEFAULT_FEED } from '#/lib/constants';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { HomeTabNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';

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

// the feed-discovery tab nudging the user toward the Feeds screen, shown logged-out and when the only
// pinned feed is Following; selecting it opens that screen rather than switching feeds, so it has no
// panel of its own
const FEEDS_DISCOVERY_TAB = '__feeds__';

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'GroupChatJoin' | 'Home' | 'Start'>;
export function HomeScreen(props: Props) {
	const { data: preferences } = usePreferencesQuery();
	const { currentAccount } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const { data: pinnedFeedInfos, isLoading: isPinnedFeedsLoading } = usePinnedFeedsInfos();

	useEffect(() => {
		const params = props.route.params;
		if (
			currentAccount &&
			props.route.name === 'Start' &&
			params &&
			'name' in params &&
			params.name &&
			params.rkey
		) {
			navigation.navigate('StarterPack', {
				rkey: params.rkey,
				name: params.name,
			});
		}
	}, [currentAccount, navigation, props.route.name, props.route.params]);

	if (preferences && pinnedFeedInfos && !isPinnedFeedsLoading) {
		return (
			<Layout.Screen noInsetTop={false}>
				<HomeScreenReady {...props} preferences={preferences} pinnedFeedInfos={pinnedFeedInfos} />
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

function HomeScreenReady({
	preferences,
	pinnedFeedInfos,
}: Props & {
	preferences: UsePreferencesQueryResponse;
	pinnedFeedInfos: SavedFeedSourceInfo[];
}) {
	const { hasSession } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const setSelectedFeed = useSetSelectedFeed();

	const allFeeds = pinnedFeedInfos.map((f) => f.feedDescriptor);
	const selectedFeed = useSelectedFeed() ?? allFeeds[0];
	const selectedIndex = Math.max(0, allFeeds.indexOf(selectedFeed!));
	useSetTitle(pinnedFeedInfos[selectedIndex]?.displayName);

	const renderFollowingEmptyState = () => <FollowingEmptyState />;
	const renderCustomFeedEmptyState = () => <CustomFeedEmptyState />;

	const whatsHotFeed: FeedDescriptor = `feedgen|${PROD_DEFAULT_FEED('whats-hot')}`;

	let sections: Section<string>[];
	if (!hasSession) {
		sections = [
			{
				id: whatsHotFeed,
				label: 'Discover',
				render: (focused) => (
					<FeedPage
						testID="customFeedPage"
						isPageFocused={focused}
						feed={whatsHotFeed}
						renderEmptyState={renderCustomFeedEmptyState}
						feedInfo={pinnedFeedInfos[0]!}
					/>
				),
			},
			{ id: FEEDS_DISCOVERY_TAB, label: 'Feeds ✨', render: () => null },
		];
	} else {
		const feedSections: Section<string>[] = pinnedFeedInfos.map((feedInfo) => {
			const feed = feedInfo.feedDescriptor;
			return {
				id: feed,
				label: feedInfo.displayName,
				render: (focused) =>
					feed === 'following' ? (
						<FeedPage
							testID="followingFeedPage"
							isPageFocused={focused}
							feed={feed}
							renderEmptyState={renderFollowingEmptyState}
							renderEndOfFeed={FollowingEndOfFeed}
							feedInfo={feedInfo}
						/>
					) : (
						<FeedPage
							testID="customFeedPage"
							isPageFocused={focused}
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
			feedSections.push({ id: FEEDS_DISCOVERY_TAB, label: 'Feeds ✨', render: () => null });
		}
		sections = feedSections;
	}

	const onValueChange = (value: string) => {
		if (value === FEEDS_DISCOVERY_TAB) {
			navigation.navigate('Feeds');
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
