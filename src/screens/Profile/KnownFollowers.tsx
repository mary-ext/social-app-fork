import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileKnownFollowersQuery } from '#/state/queries/known-followers';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useTitle } from '#/state/use-title';

import { List } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import PeopleIcon from '#/icons/central/People_round_outlined_radius1_stroke2.svg';
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
	const { data: resolvedDid, error: resolveError } = useResolveDidQuery(name);
	const { data, isPending, isFetchingNextPage, fetchNextPage, error, refetch } =
		useProfileKnownFollowersQuery(resolvedDid);

	const isError = !!(resolveError || error);
	const followers = data?.pages ? data.pages.flatMap((page) => page.followers) : [];

	if (followers.length < 1 || !moderationOpts) {
		if (isError) {
			return <ListError message={cleanError(resolveError || error)} onRetry={() => void refetch()} />;
		}

		// the paged query stays pending while the did resolves, so this covers both fetches
		if (isPending || !moderationOpts) {
			return <ProfileCard.LoadingPlaceholder />;
		}

		return (
			<ListEmpty icon={PeopleIcon} message={m['screens.profile.follow.knownFollowers.empty']({ name })} />
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
			onEndReached={() => void fetchNextPage()}
			onEndReachedThreshold={2}
		/>
	);
}
