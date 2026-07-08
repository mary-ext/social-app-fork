import { type JSX, useCallback, useEffect, useRef, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { type NavigationProp, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { getRootNavigation, getTabState, TabState } from '#/lib/routes/helpers';
import type { AllNavigatorParams } from '#/lib/routes/types';

import { softReset } from '#/state/events';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import type { FeedSourceInfo } from '#/state/queries/feed';
import { type FeedDescriptor, RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';

import { PostFeed } from '#/view/com/posts/PostFeed';
import { FAB } from '#/view/com/util/fab/FAB';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import type { ListMethods } from '#/components/List/List';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

const POLL_FREQ = 60e3; // 60sec

export function FeedPage({
	feed,
	renderEmptyState,
	renderEndOfFeed,
	savedFeedConfig,
	feedInfo,
}: {
	feed: FeedDescriptor;
	renderEmptyState: () => JSX.Element;
	renderEndOfFeed?: () => JSX.Element;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
	feedInfo: FeedSourceInfo;
}) {
	const { hasSession } = useSession();
	const navigation = useNavigation<NavigationProp<AllNavigatorParams>>();
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const feedFeedback = useFeedFeedback(feedInfo, hasSession);
	const scrollElRef = useRef<ListMethods>(null);
	const [hasNew, setHasNew] = useState(false);

	const scrollToTop = useCallback(() => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
	}, []);

	const onSoftReset = useCallback(() => {
		const isScreenFocused =
			getTabState(getRootNavigation(navigation).getState(), 'Home') === TabState.InsideAtRoot;
		if (isScreenFocused) {
			scrollToTop();
			void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
			setHasNew(false);
		}
	}, [navigation, scrollToTop, queryClient, feed]);

	useEffect(() => {
		return softReset.subscribe(onSoftReset);
	}, [onSoftReset]);

	const onPressCompose = () => {
		openComposer({});
	};

	const onPressLoadLatest = () => {
		scrollToTop();
		void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
		setHasNew(false);
	};

	return (
		<>
			<FeedFeedbackProvider value={feedFeedback}>
				<PostFeed
					enabled
					feed={feed}
					pollInterval={POLL_FREQ}
					disablePoll={hasNew}
					scrollElRef={scrollElRef}
					onScrolledDownChange={setIsScrolledDown}
					onHasNew={setHasNew}
					renderEmptyState={renderEmptyState}
					renderEndOfFeed={renderEndOfFeed}
					savedFeedConfig={savedFeedConfig}
				/>
			</FeedFeedbackProvider>
			{(isScrolledDown || hasNew) && (
				<LoadLatestBtn
					onPress={onPressLoadLatest}
					label={m['common.feeds.action.loadNew']()}
					showIndicator={hasNew}
				/>
			)}
			{hasSession && (
				<FAB
					icon={<EditBigIcon size="xl" fill={colors.white} />}
					label={m['common.compose.action.new']()}
					onClick={onPressCompose}
				/>
			)}
		</>
	);
}
