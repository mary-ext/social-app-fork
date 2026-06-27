import { useCallback, useState } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import { moderatePost } from '@atcute/bluesky-moderation';

import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePostQuotesQuery } from '#/state/queries/post-quotes';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import { Post } from '#/view/com/post/Post';

import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';

import { m } from '#/paraglide/messages';

import { List } from '../util/List';

function renderItem({ item, index }: { item: { post: AppBskyFeedDefs.PostView }; index: number }) {
	return <Post post={item.post} hideTopBorder={index === 0} />;
}

function keyExtractor(item: { post: AppBskyFeedDefs.PostView }) {
	return item.post.uri;
}

export function PostQuotes({ uri }: { uri: string }) {
	const initialNumToRender = useInitialNumToRender();
	const [isPTRing, setIsPTRing] = useState(false);

	const { data: resolvedUri, error: resolveError, isLoading: isLoadingUri } = useResolveUriQuery(uri);
	const {
		data,
		isLoading: isLoadingQuotes,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
		refetch,
	} = usePostQuotesQuery(resolvedUri?.uri);

	const moderationOpts = useModerationOpts();

	const isError = Boolean(resolveError || error);

	const quotes =
		data?.pages
			.flatMap((page) =>
				page.posts.map((post) => {
					if (!moderationOpts) {
						return null;
					}
					const moderation = moderatePost(post, moderationOpts);
					return { post, record: post.record as AppBskyFeedPost.Main, moderation };
				}),
			)
			.filter((item) => item !== null) ?? [];

	const onRefresh = useCallback(async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh quotes', { message: err });
		}
		setIsPTRing(false);
	}, [refetch, setIsPTRing]);

	const onEndReached = useCallback(async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more quotes', { message: err });
		}
	}, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);

	if (quotes.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={isLoadingUri || isLoadingQuotes}
				isError={isError}
				emptyType="results"
				emptyTitle={m['view.postThread.empty.quotesTitle']()}
				emptyMessage={m['view.postThread.empty.quotes']()}
				errorMessage={cleanError(resolveError || error)}
				sideBorders={false}
			/>
		);
	}

	// loaded
	// =
	return (
		<List
			data={quotes}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			refreshing={isPTRing}
			onRefresh={() => void onRefresh()}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={4}
			ListFooterComponent={
				<ListFooter
					isFetchingNextPage={isFetchingNextPage}
					error={cleanError(error)}
					onRetry={fetchNextPage}
					showEndMessage
					endMessageText={m['view.postThread.empty.endOfFeed']()}
				/>
			}
			// @ts-ignore our .web version only -prf
			desktopFixedHeight
			initialNumToRender={initialNumToRender}
			windowSize={11}
			sideBorders={false}
		/>
	);
}
