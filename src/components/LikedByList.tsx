import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useLikedByQuery } from '#/state/queries/post-liked-by';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';

import { BlankState } from '#/components/BlankState';
import { ErrorState } from '#/components/ErrorState';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import * as ProfileCard from '#/components/web/ProfileCard';

import HeartIcon from '#/icons/central/Heart_round_outlined_radius1_stroke1.svg';
import { m } from '#/paraglide/messages';

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

export function LikedByList({ uri, initialCount }: { uri: string; initialCount?: number }) {
	const moderationOpts = useModerationOpts();

	const { data: resolvedUri, error: resolveError } = useResolveUriQuery(uri);
	const { data, error, fetchNextPage, isFetchingNextPage, isPending } = useLikedByQuery(resolvedUri?.uri);

	const isError = !!(resolveError || error);

	const likes = data?.pages ? data.pages.flatMap((page) => page.likes) : [];

	if (isError && likes.length < 1) {
		return <ErrorState />;
	}

	// the paged query stays pending while the uri resolves, so this covers both fetches
	if (isPending || !moderationOpts) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (likes.length < 1) {
		return <BlankState icon={HeartIcon} message={m['common.like.emptyPrompt']()} />;
	}

	return (
		<List
			data={likes}
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.actor.did}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			renderItem={({ index, item }) => (
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item.actor} topBorder={index !== 0} />
			)}
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
