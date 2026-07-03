import { useState } from 'react';

import type { AppBskyFeedGetLikes as GetLikes } from '@atcute/bluesky';

import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { cleanError } from '#/lib/strings/errors';

import { useLikedByQuery } from '#/state/queries/post-liked-by';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import { ProfileCardWithFollowBtn } from '#/view/com/profile/ProfileCard';
import { List } from '#/view/com/util/List';

import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';

import { m } from '#/paraglide/messages';

function renderItem({ item, index }: { item: GetLikes.Like; index: number }) {
	return <ProfileCardWithFollowBtn key={item.actor.did} profile={item.actor} noBorder={index === 0} />;
}

function keyExtractor(item: GetLikes.Like) {
	return item.actor.did;
}

export function LikedByList({ uri }: { uri: string }) {
	const initialNumToRender = useInitialNumToRender();
	const [isPTRing, setIsPTRing] = useState(false);

	const { data: resolvedUri, error: resolveError, isLoading: isUriLoading } = useResolveUriQuery(uri);
	const {
		data,
		isLoading: isLikedByLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error: likedByError,
		refetch,
	} = useLikedByQuery(resolvedUri?.uri);

	const error = resolveError || likedByError;
	const isError = !!resolveError || !!likedByError;

	let likes: GetLikes.Like[] = [];
	if (data?.pages) {
		likes = data.pages.flatMap((page) => page.likes);
	}

	const onRefresh = async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh likes', { message: err });
		}
		setIsPTRing(false);
	};

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more likes', { message: err });
		}
	};

	if (likes.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={isUriLoading || isLikedByLoading}
				isError={isError}
				emptyType="results"
				emptyTitle={m['common.like.empty']()}
				emptyMessage={m['common.like.emptyPrompt']()}
				errorMessage={cleanError(resolveError || error)}
				onRetry={isError ? refetch : undefined}
				topBorder={false}
				sideBorders={false}
			/>
		);
	}

	return (
		<List
			data={likes}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			refreshing={isPTRing}
			onRefresh={() => void onRefresh()}
			onEndReached={() => void onEndReached()}
			ListFooterComponent={
				<ListFooter
					isFetchingNextPage={isFetchingNextPage}
					error={cleanError(error)}
					onRetry={fetchNextPage}
				/>
			}
			onEndReachedThreshold={3}
			initialNumToRender={initialNumToRender}
			windowSize={11}
			sideBorders={false}
		/>
	);
}
