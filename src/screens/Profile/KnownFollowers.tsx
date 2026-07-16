import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { useTitle } from '#/lib/hooks/useTitle';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileKnownFollowersQuery } from '#/state/queries/known-followers';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

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
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<ProfileKnownFollowers name={actor} />
		</Layout.Screen>
	);
};

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

function ProfileKnownFollowers({ name }: { name: string }) {
	const initialNumToRender = useInitialNumToRender();
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

	const isError = Boolean(resolveError || error);
	const followers = data?.pages ? data.pages.flatMap((page) => page.followers) : [];

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) {
			return;
		}
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more followers', { message: err });
		}
	};

	if (!moderationOpts || ((isDidLoading || isFollowersLoading) && followers.length < 1 && !isError)) {
		return <ProfileCard.LoadingPlaceholder count={initialNumToRender} />;
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
				sideBorders={false}
			/>
		);
	}

	return (
		<List
			data={followers}
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
