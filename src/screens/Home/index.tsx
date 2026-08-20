import type { ReactNode } from 'react';

import { softReset } from '#/state/events';
import { setSelectedFeed, useSelectedFeed } from '#/state/preferences/selected-feed';
import { usePinnedFeedsInfos } from '#/state/queries/feed';
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

	// keep header navigation available while feeds load or fail
	let sections: Section<string>[];
	if (!preferences.data || !pinnedFeeds.data) {
		sections = [];
	} else if (!hasSession) {
		const feedInfo = pinnedFeeds.data[0]!;
		sections = [
			{
				id: feedInfo.uri,
				label: feedInfo.displayName,
				children: (
					<FeedPage
						feed={feedInfo.feedDescriptor}
						feedInfo={feedInfo}
						renderEmptyState={renderCustomFeedEmptyState}
					/>
				),
			},
		];
	} else {
		sections = pinnedFeeds.data.map((feedInfo) => {
			const feed = feedInfo.feedDescriptor;
			return {
				id: feedInfo.uri,
				label: feedInfo.displayName,
				children:
					feed.type === 'following' ? (
						<FeedPage
							key={feedInfo.uri}
							feed={feed}
							feedInfo={feedInfo}
							renderEmptyState={renderFollowingEmptyState}
						/>
					) : (
						<FeedPage
							key={feedInfo.uri}
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

	const onSelectFeed = (feed: string) => {
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
