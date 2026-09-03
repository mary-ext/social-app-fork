import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { uniqueBy } from '@mary/array-fns';

import { cleanError } from '#/lib/errors';

import { useMyLikesQuery } from '#/state/queries/my-likes';

import { BlankState } from '#/components/BlankState';
import { ErrorState } from '#/components/ErrorState';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import { Post } from '#/components/Post/Post';
import { PostFeedLoadingPlaceholder } from '#/components/PostFeed/PostFeedLoadingPlaceholder';

import HeartIcon from '#/icons/central/Heart_round_outlined_radius1_stroke1.svg';
import { m } from '#/paraglide/messages';

const LIKE_ITEM_HEIGHT_ESTIMATE = 300;

const keyExtractor = (item: AppBskyFeedDefs.PostView) => item.uri;

export function LikesTab() {
	const { data, error, fetchNextPage, isError, isFetchingNextPage, isPending, refetch } = useMyLikesQuery();

	const posts = uniqueBy(
		data?.pages.flatMap((page) => page.feed.map((item) => item.post)) ?? [],
		(post) => post.uri,
	);

	if (posts.length < 1) {
		if (isError) {
			return <ErrorState onRetry={() => void refetch()} />;
		}

		if (isPending) {
			return <PostFeedLoadingPlaceholder />;
		}

		return <BlankState icon={HeartIcon} message={m['common.like.empty']()} />;
	}

	return (
		<List
			data={posts}
			estimateHeight={LIKE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			renderItem={({ index, item }) => <Post hideTopBorder={index === 0} post={item} />}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			onEndReached={() => {
				if (isError) {
					return;
				}
				void fetchNextPage();
			}}
			onEndReachedThreshold={2}
		/>
	);
}
