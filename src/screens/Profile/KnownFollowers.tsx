import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileKnownFollowersQuery } from '#/state/queries/known-followers';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import * as Layout from '#/components/Layout';
import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileKnownFollowers'>;

export const ProfileKnownFollowersScreen = ({ route }: Props) => {
	const initialNumToRender = useInitialNumToRender();
	const { name } = route.params;
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

	const { data: profile } = useProfileQuery({ did: resolvedDid });

	useSetTitle(
		profile ? m['screens.profile.follow.knownFollowers.title']({ handle: profile.handle }) : undefined,
	);

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || !!error) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more followers', { message: err });
		}
	};

	const followers = data?.pages ? data.pages.flatMap((page) => page.followers) : [];
	const isError = Boolean(resolveError || error);

	if (!moderationOpts || ((isDidLoading || isFollowersLoading) && followers.length < 1 && !isError)) {
		return (
			<Layout.Screen>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['common.follow.followersYouKnow']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
					<Layout.Header.Slot />
				</Layout.Header.Outer>
				<ProfileCard.LoadingPlaceholder count={initialNumToRender} />
			</Layout.Screen>
		);
	}

	if (followers.length < 1) {
		return (
			<Layout.Screen>
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['common.follow.followersYouKnow']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
					<Layout.Header.Slot />
				</Layout.Header.Outer>
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
			</Layout.Screen>
		);
	}

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.follow.followersYouKnow']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<List
				data={followers}
				keyExtractor={(item) => item.did}
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
		</Layout.Screen>
	);
};
