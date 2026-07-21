import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useLikedByQuery } from '#/state/queries/post-liked-by';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

export function LikedByList({ uri, initialCount }: { uri: string; initialCount?: number }) {
	const moderationOpts = useModerationOpts();

	const { data: resolvedUri, error: resolveError, isLoading: isLoadingUri } = useResolveUriQuery(uri);
	const {
		data,
		isLoading: isLoadingLikes,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
	} = useLikedByQuery(resolvedUri?.uri);

	const isError = !!(resolveError || error);

	const likes = data?.pages ? data.pages.flatMap((page) => page.likes) : [];

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more likes', { message: err });
		}
	};

	if (!moderationOpts || ((isLoadingUri || isLoadingLikes) && likes.length < 1 && !isError)) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (likes.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={false}
				isError={isError}
				emptyType="results"
				emptyTitle={m['common.like.empty']()}
				emptyMessage={m['common.like.emptyPrompt']()}
				errorMessage={cleanError(resolveError || error)}
				topBorder={false}
			/>
		);
	}

	return (
		<List
			data={likes}
			keyExtractor={(item) => item.actor.did}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={2}
			ListFooterComponent={
				<ListFooter
					isFetchingNextPage={isFetchingNextPage}
					error={cleanError(error)}
					onRetry={fetchNextPage}
				/>
			}
			renderItem={({ index, item }) => (
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item.actor} topBorder={index !== 0} />
			)}
		/>
	);
}
