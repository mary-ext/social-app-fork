import { useState } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import { moderatePost } from '@atcute/bluesky-moderation';

import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePostQuery } from '#/state/queries/post';
import { usePostQuotesQuery } from '#/state/queries/post-quotes';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import { Post } from '#/view/com/post/Post';
import { List } from '#/view/com/util/List';

import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export const PostQuotesScreen = () => {
	const [{ name, rkey }] = useParams('PostQuotes');
	const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useTitle(
		post ? m['common.a11y.postByAuthor']({ handle: post.author.handle }) : m['navigation.post.title'](),
	);

	let quoteCount;
	if (post) {
		quoteCount = post.quoteCount;
	}

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{post && (
						<>
							<Layout.Header.TitleText>{m['common.quote.label']()}</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.post.quote.count']({ count: quoteCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<PostQuotes uri={uri} />
		</Layout.Screen>
	);
};

function renderItem({ item, index }: { item: { post: AppBskyFeedDefs.PostView }; index: number }) {
	return <Post post={item.post} hideTopBorder={index === 0} />;
}

function keyExtractor(item: { post: AppBskyFeedDefs.PostView }) {
	return item.post.uri;
}

function PostQuotes({ uri }: { uri: string }) {
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

	const onRefresh = async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh quotes', { message: err });
		}
		setIsPTRing(false);
	};

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more quotes', { message: err });
		}
	};

	if (quotes.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={isLoadingUri || isLoadingQuotes}
				isError={isError}
				emptyType="results"
				emptyTitle={m['screens.postThread.engagement.quote.empty']()}
				emptyMessage={m['screens.postThread.engagement.quote.emptyPrompt']()}
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
					endMessageText={m['screens.postThread.engagement.quote.endOfFeed']()}
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
