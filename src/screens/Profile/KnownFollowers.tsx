import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileKnownFollowersQuery } from '#/state/queries/known-followers';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useTitle } from '#/state/use-title';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export const ProfileKnownFollowersScreen = () => {
	const [{ actor }] = useParams('ProfileKnownFollowers');
	const { data: resolvedDid } = useResolveDidQuery(actor);
	const { data: profile } = useProfileQuery({ did: resolvedDid });

	useTitle(
		profile
			? m['screens.profile.follow.knownFollowers.title']({ handle: profile.handle })
			: m['common.follow.followersYouKnow'](),
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.follow.followersYouKnow']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<ProfileKnownFollowers name={actor} />
		</Layout.Screen>
	);
};

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

function ProfileKnownFollowers({ name }: { name: string }) {
	const moderationOpts = useModerationOpts();
	const { data: resolvedDid, isLoading: isDidLoading, error: resolveError } = useResolveDidQuery(name);
	const {
		data,
		isLoading: isFollowersLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
		refetch,
	} = useProfileKnownFollowersQuery(resolvedDid);

	const isError = !!(resolveError || error);
	const followers = data?.pages ? data.pages.flatMap((page) => page.followers) : [];

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		void fetchNextPage();
	};

	if (!moderationOpts || ((isDidLoading || isFollowersLoading) && followers.length < 1 && !isError)) {
		return <ProfileCard.LoadingPlaceholder />;
	}

	if (followers.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={false}
				isError={isError}
				emptyType="results"
				emptyMessage={m['screens.profile.follow.knownFollowers.empty']({ name })}
				errorMessage={cleanError(resolveError || error)}
				onRetry={isError ? refetch : undefined}
				topBorder={false}
			/>
		);
	}

	return (
		<List
			data={followers}
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
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
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item} topBorder={index !== 0} />
			)}
		/>
	);
}
