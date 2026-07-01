import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { usePostRepostedByQuery } from '#/state/queries/post-reposted-by';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

export function PostRepostedBy({ uri, initialCount }: { uri: string; initialCount?: number }) {
	const moderationOpts = useModerationOpts();

	const { data: resolvedUri, error: resolveError, isLoading: isLoadingUri } = useResolveUriQuery(uri);
	const {
		data,
		isLoading: isLoadingRepostedBy,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
	} = usePostRepostedByQuery(resolvedUri?.uri);

	const isError = Boolean(resolveError || error);

	const repostedBy = data?.pages ? data.pages.flatMap((page) => page.repostedBy) : [];

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more reposts', { message: err });
		}
	};

	if (!moderationOpts || ((isLoadingUri || isLoadingRepostedBy) && repostedBy.length < 1 && !isError)) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (repostedBy.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={false}
				isError={isError}
				emptyType="results"
				emptyTitle={m['screens.postThread.engagement.repost.empty']()}
				emptyMessage={m['screens.postThread.engagement.repost.emptyPrompt']()}
				errorMessage={cleanError(resolveError || error)}
				sideBorders={false}
			/>
		);
	}

	return (
		<List
			data={repostedBy}
			keyExtractor={keyExtractor}
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
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item} topBorder={index !== 0} />
			)}
		/>
	);
}
