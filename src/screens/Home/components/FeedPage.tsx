import { type JSX, useRef, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { softReset } from '#/state/events';
import { FeedFeedbackProvider, useFeedFeedback } from '#/state/feed-feedback';
import type { FeedSourceInfo } from '#/state/queries/feed';
import type { FeedDescriptor } from '#/state/queries/feed-descriptor';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useSession } from '#/state/session';

import { useOpenComposer } from '#/features/composer/open-composer';

import { FAB } from '#/components/FAB';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { PostFeed } from '#/components/PostFeed/PostFeed';

import EditBigIcon from '#/icons/central/EditBig_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useFocusEffect } from '#/router';

const POLL_FREQ = 60e3; // 60sec

export function FeedPage({
	feed,
	renderEmptyState,
	savedFeedConfig,
	feedInfo,
}: {
	feed: FeedDescriptor;
	renderEmptyState: () => JSX.Element;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
	feedInfo: FeedSourceInfo;
}) {
	const { hasSession } = useSession();
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const feedFeedback = useFeedFeedback(feedInfo, hasSession);
	const scrollElRef = useRef<ListMethods>(null);
	const [hasNew, setHasNew] = useState(false);

	const onPressCompose = () => {
		openComposer({});
	};

	const onPressLoadLatest = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
		void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
		setHasNew(false);
	};

	useFocusEffect(() => softReset.subscribe(onPressLoadLatest));

	return (
		<>
			<FeedFeedbackProvider value={feedFeedback}>
				<PostFeed
					feed={feed}
					pollInterval={POLL_FREQ}
					disablePoll={hasNew}
					scrollElRef={scrollElRef}
					onScrolledDownChange={setIsScrolledDown}
					onHasNew={setHasNew}
					renderEmptyState={renderEmptyState}
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
				<FAB icon={EditBigIcon} label={m['common.compose.action.new']()} onClick={onPressCompose} />
			)}
		</>
	);
}
