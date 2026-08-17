import type { ReactNode } from 'react';

import { bskyFeedUri } from '#/lib/constants/feeds';

import { softReset } from '#/state/events';
import { setSelectedFeed, useSelectedFeed } from '#/state/preferences/selected-feed';
import { usePinnedFeedsInfos } from '#/state/queries/feed';
import type { FeedDescriptor } from '#/state/queries/post-feed';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { CustomFeedEmptyState } from '#/screens/Home/components/CustomFeedEmptyState';
import { FeedPage } from '#/screens/Home/components/FeedPage';
import { FollowingEmptyState } from '#/screens/Home/components/FollowingEmptyState';
import { HomeHeaderLayout } from '#/screens/Home/components/HomeHeaderLayout';
import { NoFeedsPinned } from '#/screens/Home/components/NoFeedsPinned';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { Error } from '#/components/Error';
import type { Section } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

const renderFollowingEmptyState = () => <FollowingEmptyState />;
const renderCustomFeedEmptyState = () => <CustomFeedEmptyState />;

export function HomeScreen() {
	const { hasSession } = useSession();
	const selectedFeed = useSelectedFeed();
	const preferences = usePreferencesQuery();
	const pinnedFeeds = usePinnedFeedsInfos();

	const whatsHotFeed: FeedDescriptor = `feedgen|${bskyFeedUri('whats-hot')}`;

	// keep header navigation available while feeds load or fail
	let sections: Section<FeedDescriptor>[];
	if (!preferences.data || !pinnedFeeds.data) {
		sections = [];
	} else if (!hasSession) {
		sections = [
			{
				id: whatsHotFeed,
				label: 'Discover',
				children: (
					<FeedPage
						feed={whatsHotFeed}
						feedInfo={pinnedFeeds.data[0]!}
						renderEmptyState={renderCustomFeedEmptyState}
					/>
				),
			},
		];
	} else {
		sections = pinnedFeeds.data.map((feedInfo) => {
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
	const activeFeed = feeds[activeIndex];
	useTitle(active?.label ?? m['common.nav.home']());

	const onSelectFeed = (feed: FeedDescriptor) => {
		window.scrollTo(0, 0);

		if (feed === active?.id) {
			softReset.emit();
			return;
		}

		setSelectedFeed(feed);
	};

	let pending = false;
	let body: ReactNode;
	if (preferences.data && pinnedFeeds.data) {
		if (hasSession && pinnedFeeds.data.length === 0) {
			body = <NoFeedsPinned preferences={preferences.data} />;
		} else {
			body = active?.children;
		}
	} else if (preferences.isError || pinnedFeeds.isError) {
		body = (
			<Error
				hideBackButton
				message={m['screens.home.error.load']()}
				onRetry={() => Promise.all([preferences.refetch(), pinnedFeeds.refetch()])}
				title={m['common.error.oops']()}
			/>
		);
	} else {
		pending = true;
		body = <CenteredSpinner fill label={m['common.status.loading']()} size="_2xl" />;
	}

	return (
		<Layout.Screen>
			<HomeHeaderLayout
				feedSwitcher={activeFeed && { activeFeed, feeds, onSelectFeed }}
				pending={pending && hasSession}
			/>
			{body}
		</Layout.Screen>
	);
}
