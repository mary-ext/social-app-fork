import { useCallback, useEffect, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { softReset } from '#/state/events';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import { type FeedSourceFeedInfo, useFeedSourceInfoQuery } from '#/state/queries/feed';
import { type FeedDescriptor, RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { usePreferencesQuery, type UsePreferencesQueryResponse } from '#/state/queries/preferences';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';

import { PostFeed } from '#/view/com/posts/PostFeed';
import { PostFeedLoadingPlaceholder } from '#/view/com/posts/PostFeedLoadingPlaceholder';
import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { FAB } from '#/view/com/util/fab/FAB';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { ProfileFeedHeader, ProfileFeedHeaderSkeleton } from '#/screens/Profile/components/ProfileFeedHeader';

import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import * as Layout from '#/components/Layout';
import type { ListMethods } from '#/components/List/List';

import { m } from '#/paraglide/messages';
import { useIsFocused, useParams } from '#/routes';
import { colors } from '#/styles/colors';

export function ProfileFeedScreen() {
	const { rkey, name: handleOrDid } = useParams('ProfileFeed');
	const uri = makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey);
	const { error, data: resolvedUri, refetch, isRefetching } = useResolveUriQuery(uri);

	if (error && !isRefetching) {
		return (
			<Layout.Screen testID="profileFeedScreenError">
				<ErrorScreen
					showHeader
					title={m['screens.profile.feed.loadError']()}
					message={cleanError(error)}
					onPressTryAgain={() => void refetch()}
				/>
			</Layout.Screen>
		);
	}

	return resolvedUri ? (
		<Layout.Screen testID="profileFeedScreen">
			<ProfileFeedScreenIntermediate feedUri={resolvedUri.uri} />
		</Layout.Screen>
	) : (
		<Layout.Screen testID="profileFeedScreen">
			<ProfileFeedHeaderSkeleton />
			<Layout.Content>
				<PostFeedLoadingPlaceholder />
			</Layout.Content>
		</Layout.Screen>
	);
}

function ProfileFeedScreenIntermediate({ feedUri }: { feedUri: string }) {
	const { data: preferences } = usePreferencesQuery();
	const { data: info } = useFeedSourceInfoQuery({ uri: feedUri });

	if (!preferences || !info) {
		return (
			<Layout.Content>
				<ProfileFeedHeaderSkeleton />
				<PostFeedLoadingPlaceholder />
			</Layout.Content>
		);
	}

	return <ProfileFeedScreenInner preferences={preferences} feedInfo={info as FeedSourceFeedInfo} />;
}

function renderPostsEmpty() {
	return <EmptyState icon={HashtagWideIcon} iconSize="2xl" message={m['common.feeds.empty']()} />;
}

export function ProfileFeedScreenInner({
	feedInfo,
}: {
	preferences: UsePreferencesQueryResponse;
	feedInfo: FeedSourceFeedInfo;
}) {
	const { hasSession } = useSession();
	const { openComposer } = useOpenComposer();
	const isScreenFocused = useIsFocused();

	useTitle(feedInfo.displayName);

	const feed = `feedgen|${feedInfo.uri}` as FeedDescriptor;

	const [hasNew, setHasNew] = useState(false);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const queryClient = useQueryClient();
	const feedFeedback = useFeedFeedback(feedInfo, hasSession);
	const scrollElRef = useRef<ListMethods | null>(null);

	const onScrollToTop = useCallback(() => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0, // -headerHeight,
		});
		void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
		setHasNew(false);
	}, [scrollElRef, queryClient, feed, setHasNew]);

	useEffect(() => {
		if (!isScreenFocused) {
			return;
		}
		return softReset.subscribe(onScrollToTop);
	}, [onScrollToTop, isScreenFocused]);

	return (
		<>
			<ProfileFeedHeader info={feedInfo} />
			<FeedFeedbackProvider value={feedFeedback}>
				<PostFeed
					enabled
					feed={feed}
					pollInterval={60e3}
					disablePoll={hasNew}
					onHasNew={setHasNew}
					scrollElRef={scrollElRef}
					onScrolledDownChange={setIsScrolledDown}
					renderEmptyState={renderPostsEmpty}
				/>
			</FeedFeedbackProvider>
			{(isScrolledDown || hasNew) && (
				<LoadLatestBtn
					onPress={onScrollToTop}
					label={m['common.feeds.action.loadNew']()}
					showIndicator={hasNew}
				/>
			)}
			{hasSession && (
				<FAB
					icon={<EditBigIcon size="xl" fill={colors.white} />}
					label={m['common.compose.action.new']()}
					onClick={() => openComposer({})}
				/>
			)}
		</>
	);
}
