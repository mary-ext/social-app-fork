import { cleanError } from '#/lib/errors';

import { useMyLikesQuery } from '#/state/queries/my-likes';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { Post } from '#/components/Post/Post';

import HeartIcon from '#/icons/central/Heart_round_outlined_radius1_stroke1.svg';
import { m } from '#/paraglide/messages';

const LIKE_ITEM_HEIGHT_ESTIMATE = 300;

/** renders liked posts. */
export function LikesTab() {
	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isError,
		isFetched,
		isFetchingNextPage,
		isLoading,
		refetch,
	} = useMyLikesQuery();

	const posts = data?.pages.flatMap((page) => page.feed.map((item) => item.post)) ?? [];

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (posts.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={isLoading || !isFetched}
				isError={isError}
				onRetry={refetch}
				emptyMessage={m['common.like.empty']()}
				emptyStateIcon={HeartIcon}
				useEmptyState
			/>
		);
	}

	return (
		<List
			data={posts}
			estimateHeight={LIKE_ITEM_HEIGHT_ESTIMATE}
			// cursor pages can overlap.
			keyExtractor={(item, index) => `${item.uri}-${index}`}
			renderItem={({ index, item }) => <Post hideTopBorder={index === 0} post={item} />}
			ListFooterComponent={
				<ListFooter
					error={cleanError(error)}
					isFetchingNextPage={isFetchingNextPage}
					onRetry={fetchNextPage}
				/>
			}
			onEndReached={onEndReached}
			onEndReachedThreshold={2}
		/>
	);
}
