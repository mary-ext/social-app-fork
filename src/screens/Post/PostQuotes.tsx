import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { moderatePost } from '@atcute/bluesky-moderation';

import { getPostRecord } from '#/lib/api/record-views';
import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { usePostQuery } from '#/state/queries/post';
import { usePostQuotesQuery } from '#/state/queries/post-quotes';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { Post } from '#/components/Post/Post';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export const PostQuotesScreen = () => {
	const [{ actor, rkey }] = useParams('PostQuotes');
	const uri = makeRecordUri(actor, 'app.bsky.feed.post', rkey);
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
			</Layout.Header.Outer>
			<PostQuotes uri={uri} />
		</Layout.Screen>
	);
};

const POST_ITEM_HEIGHT_ESTIMATE = 300;

function renderItem({ item, index }: { item: { post: AppBskyFeedDefs.PostView }; index: number }) {
	return <Post post={item.post} hideTopBorder={index === 0} />;
}

function keyExtractor(item: { post: AppBskyFeedDefs.PostView }) {
	return item.post.uri;
}

function PostQuotes({ uri }: { uri: string }) {
	const { data: resolvedUri, error: resolveError, isLoading: isLoadingUri } = useResolveUriQuery(uri);
	const {
		data,
		isLoading: isLoadingQuotes,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
	} = usePostQuotesQuery(resolvedUri?.uri);

	const moderationOpts = useModerationOpts();

	const isError = !!(resolveError || error);

	const quotes = moderationOpts
		? (data?.pages.flatMap((page) =>
				page.posts.map((post) => ({
					post,
					record: getPostRecord(post),
					moderation: moderatePost(post, moderationOpts),
				})),
			) ?? [])
		: [];

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		void fetchNextPage();
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
			/>
		);
	}

	// loaded
	// =
	return (
		<List
			data={quotes}
			estimateHeight={POST_ITEM_HEIGHT_ESTIMATE}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			onEndReached={onEndReached}
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
		/>
	);
}
