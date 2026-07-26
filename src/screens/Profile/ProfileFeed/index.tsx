import { useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { TRENDING_DID } from '#/lib/constants';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { softReset } from '#/state/events';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import { type FeedSourceFeedInfo, isFeedSourceFeedInfo, useFeedSourceInfoQuery } from '#/state/queries/feed';
import { type FeedDescriptor, RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';

import { ProfileFeedHeader, ProfileFeedHeaderSkeleton } from '#/screens/Profile/components/ProfileFeedHeader';

import { EmptyState } from '#/components/EmptyState';
import { ErrorScreen } from '#/components/ErrorScreen';
import { FAB } from '#/components/FAB';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { PostFeed } from '#/components/PostFeed/PostFeed';
import { PostFeedLoadingPlaceholder } from '#/components/PostFeed/PostFeedLoadingPlaceholder';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useFocusEffect, useParams } from '#/routes';
import { colors } from '#/styles/colors';

export function ProfileFeedScreen() {
	const [{ rkey, actor: handleOrDid }] = useParams('ProfileFeed');
	const uri = makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey);
	// the appview looks feed generators up by their canonical at-uri, so a handle-based one won't match
	const { error, data: resolvedUri, refetch, isRefetching } = useResolveUriQuery(uri);
	const { data: info } = useFeedSourceInfoQuery({ uri: resolvedUri?.uri });

	if (error && !isRefetching) {
		return (
			<Layout.Screen>
				<ErrorScreen
					showHeader
					title={m['screens.profile.feed.loadError']()}
					message={cleanError(error)}
					onPressTryAgain={() => void refetch()}
				/>
			</Layout.Screen>
		);
	}

	return (
		<Layout.Screen>
			{info && isFeedSourceFeedInfo(info) ? (
				<ProfileFeedScreenInner feedInfo={info} />
			) : (
				<>
					<ProfileFeedHeaderSkeleton />
					<Layout.Content>
						<PostFeedLoadingPlaceholder />
					</Layout.Content>
				</>
			)}
		</Layout.Screen>
	);
}

function renderPostsEmpty() {
	return <EmptyState icon={HashtagWideIcon} iconSize="2xl" message={m['common.feeds.empty']()} />;
}

function ProfileFeedScreenInner({ feedInfo }: { feedInfo: FeedSourceFeedInfo }) {
	const { hasSession } = useSession();
	const { openComposer } = useOpenComposer();

	useTitle(feedInfo.displayName);

	const feed = `feedgen|${feedInfo.uri}` as FeedDescriptor;

	const [hasNew, setHasNew] = useState(false);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const queryClient = useQueryClient();
	const feedFeedback = useFeedFeedback(feedInfo, hasSession);
	const scrollElRef = useRef<ListMethods | null>(null);

	const onScrollToTop = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0, // -headerHeight,
		});
		void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
		setHasNew(false);
	};

	useFocusEffect(() => softReset.subscribe(onScrollToTop));

	const isTrending = feedInfo.creatorDid === TRENDING_DID;

	return (
		<>
			<ProfileFeedHeader info={feedInfo} isTrending={isTrending} />
			<FeedFeedbackProvider value={feedFeedback}>
				<PostFeed
					description={isTrending ? feedInfo.description : undefined}
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
