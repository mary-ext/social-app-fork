import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { moderatePost } from '@atcute/bluesky-moderation';

import { getPostRecord } from '#/lib/api/record-casts';
import { makeRecordUri } from '#/lib/at-uri';
import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { usePostQuery } from '#/state/queries/post';
import { usePostQuotesQuery } from '#/state/queries/post-quotes';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { useTitle } from '#/state/use-title';

import { List } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';
import { Post } from '#/components/Post/Post';
import { PostFeedLoadingPlaceholder } from '#/components/PostFeed/PostFeedLoadingPlaceholder';
import * as Layout from '#/components/web/Layout';

import CloseQuoteIcon from '#/icons/central/CloseQuote2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

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
	const { data: resolvedUri, error: resolveError } = useResolveUriQuery(uri);
	const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, error } = usePostQuotesQuery(
		resolvedUri?.uri,
	);

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

	if (quotes.length < 1) {
		if (isError) {
			return <ListError message={cleanError(resolveError || error)} />;
		}

		if (isPending || !moderationOpts) {
			return <PostFeedLoadingPlaceholder />;
		}

		return (
			<ListEmpty icon={CloseQuoteIcon} message={m['screens.postThread.engagement.quote.emptyPrompt']()} />
		);
	}

	return (
		<List
			data={quotes}
			estimateHeight={POST_ITEM_HEIGHT_ESTIMATE}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : !hasNextPage ? (
						<ListTail.End>{m['screens.postThread.engagement.quote.endOfFeed']()}</ListTail.End>
					) : null}
				</ListTail.Frame>
			}
			onEndReached={() => void fetchNextPage()}
			onEndReachedThreshold={2}
		/>
	);
}
