import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import PeopleRemoveIcon from '#/icons/central/PeopleRemove_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { useParams, useRouter } from '#/routes';

export const ProfileFollowsScreen = () => {
	const [{ actor }] = useParams('ProfileFollows');
	const { data: resolvedDid } = useResolveDidQuery(actor);
	const { data: profile } = useProfileQuery({
		did: resolvedDid,
	});

	const followsCount = profile?.followsCount;

	useTitle(
		profile
			? m['screens.profile.follow.following.title']({ handle: profile.handle })
			: m['common.follow.action.following'](),
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
								{m['screens.profile.follow.following.count']({ count: followsCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<ProfileFollows name={actor} initialCount={followsCount} />
		</Layout.Screen>
	);
};

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

function ProfileFollows({ name, initialCount }: { name: string; initialCount?: number }) {
	const { currentAccount } = useSession();
	const router = useRouter();
	const moderationOpts = useModerationOpts();

	const onPressFindAccounts = () => {
		router.navigate({ to: { name: 'Explore' } });
	};

	const { data: resolvedDid, isLoading: isDidLoading, error: resolveError } = useResolveDidQuery(name);
	const isMe = resolvedDid === currentAccount?.did;
	// your own following list is one you curated in order, so keep it chronological; on someone else's profile
	// the interesting question is who matters, which is what `top` answers.
	const sort = isMe ? 'latest' : 'top';
	const {
		data,
		isLoading: isFollowsLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
		refetch,
	} = useProfileFollowsQuery(resolvedDid, { sort });

	const isError = !!resolveError || !!error;

	const follows = data?.pages ? data.pages.flatMap((page) => page.follows) : [];

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || !!error) {
			return;
		}
		void fetchNextPage();
	};

	if (!moderationOpts || ((isDidLoading || isFollowsLoading) && follows.length < 1 && !isError)) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (follows.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={false}
				isError={isError}
				emptyType="results"
				emptyMessage={
					isMe
						? m['view.profile.followers.followingEmpty']()
						: m['view.profile.followers.followingEmptyUser']()
				}
				errorMessage={cleanError(resolveError || error)}
				onRetry={isError ? refetch : undefined}
				useEmptyState={true}
				emptyStateIcon={PeopleRemoveIcon}
				emptyStateButton={{
					label: m['view.profile.action.seeSuggested'](),
					text: m['view.profile.action.seeSuggested'](),
					onPress: onPressFindAccounts,
					size: 'tiny',
					color: 'primary',
				}}
			/>
		);
	}

	return (
		<List
			data={follows}
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
