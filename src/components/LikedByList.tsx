import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useLikedByQuery } from '#/state/queries/post-liked-by';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

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

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		void fetchNextPage();
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
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.actor.did}
			onEndReached={onEndReached}
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
