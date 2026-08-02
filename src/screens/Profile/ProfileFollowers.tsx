import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { useTitle } from '#/lib/hooks/useTitle';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useProfileFollowersQuery } from '#/state/queries/profile-followers';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import PeopleRemoveIcon from '#/icons/central/PeopleRemove_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { useParams, useRouter } from '#/routes';

export const ProfileFollowersScreen = () => {
	const [{ actor }] = useParams('ProfileFollowers');
	const { data: resolvedDid } = useResolveDidQuery(actor);
	const { data: profile } = useProfileQuery({
		did: resolvedDid,
	});

	const followersCount = profile?.followersCount;

	useTitle(
		profile
			? m['screens.profile.follow.followers.title']({ handle: profile.handle })
			: m['navigation.followers.title'](),
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{profile && (
						<>
							<Layout.Header.TitleText>
								{sanitizeDisplayName(profile.displayName || profile.handle)}
							</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.profile.follow.followers.count']({ count: followersCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<ProfileFollowers name={actor} initialCount={followersCount} />
		</Layout.Screen>
	);
};

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

function ProfileFollowers({ name, initialCount }: { name: string; initialCount?: number }) {
	const router = useRouter();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	const { data: resolvedDid, isLoading: isDidLoading, error: resolveError } = useResolveDidQuery(name);
	const isMe = resolvedDid === currentAccount?.did;
	// your own followers read as a log of who arrived, so keep them chronological; on someone else's profile
	// the interesting question is who matters, which is what `top` answers.
	const sort = isMe ? 'latest' : 'top';
	const {
		data,
		isLoading: isFollowersLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
		refetch,
	} = useProfileFollowersQuery(resolvedDid, { sort });

	const isError = !!resolveError || !!error;

	const followers = data?.pages ? data.pages.flatMap((page) => page.followers) : [];

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || !!error) {
			return;
		}
		void fetchNextPage();
	};

	if (!moderationOpts || ((isDidLoading || isFollowersLoading) && followers.length < 1 && !isError)) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (followers.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={false}
				isError={isError}
				emptyType="results"
				emptyMessage={
					isMe
						? m['view.profile.followers.followersEmpty']()
						: m['view.profile.followers.followersEmptyUser']()
				}
				errorMessage={cleanError(resolveError || error)}
				onRetry={isError ? refetch : undefined}
				useEmptyState={true}
				emptyStateIcon={PeopleRemoveIcon}
				emptyStateButton={{
					label: m['common.action.goBack'](),
					text: m['common.action.goBack'](),
					color: 'secondary',
					size: 'small',
					onPress: () => {
						router.back();
					},
				}}
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
