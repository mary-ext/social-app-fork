import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useProfileFollowersQuery } from '#/state/queries/profile-followers';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { BlankState } from '#/components/BlankState';
import { ErrorState } from '#/components/ErrorState';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import PeopleRemoveIcon from '#/icons/central/PeopleRemove_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

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
							<Layout.Header.TitleText>{profile.handle}</Layout.Header.TitleText>
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
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	const { data: resolvedDid, error: resolveError } = useResolveDidQuery(name);
	const isMe = resolvedDid === currentAccount?.did;

	const sort = isMe ? 'latest' : 'top';
	const { data, isPending, isFetchingNextPage, fetchNextPage, error, refetch } = useProfileFollowersQuery(
		resolvedDid,
		{ sort },
	);

	const isError = !!resolveError || !!error;

	const followers = data?.pages ? data.pages.flatMap((page) => page.followers) : [];

	if (isError && followers.length < 1) {
		return <ErrorState onRetry={() => void refetch()} />;
	}

	// the paged query stays pending while the did resolves, so this covers both fetches
	if (isPending || !moderationOpts) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (followers.length < 1) {
		return (
			<BlankState
				icon={PeopleRemoveIcon}
				message={
					isMe
						? m['view.profile.followers.followersEmpty']()
						: m['view.profile.followers.followersEmptyUser']()
				}
			/>
		);
	}

	return (
		<List
			data={followers}
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
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
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item} topBorder={index !== 0} />
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
