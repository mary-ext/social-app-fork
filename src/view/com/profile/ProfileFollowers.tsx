import { useMemo } from 'react';
import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';
import { useNavigation } from '@react-navigation/native';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileFollowersQuery } from '#/state/queries/profile-followers';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { PeopleRemove2_Stroke1_Corner0_Rounded as PeopleRemoveIcon } from '#/components/icons/PeopleRemove2';
import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

export function ProfileFollowers({ name, initialCount }: { name: string; initialCount?: number }) {
	const navigation = useNavigation();
	const { currentAccount } = useSession();
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
	} = useProfileFollowersQuery(resolvedDid);

	const isError = !!resolveError || !!error;
	const isMe = resolvedDid === currentAccount?.did;

	const followers = useMemo(() => {
		if (data?.pages) {
			return data.pages.flatMap((page) => page.followers);
		}
		return [];
	}, [data]);

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || !!error) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more followers', { message: err });
		}
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
				sideBorders={false}
				useEmptyState={true}
				emptyStateIcon={PeopleRemoveIcon}
				emptyStateButton={{
					label: m['common.action.goBack'](),
					text: m['common.action.goBack'](),
					color: 'secondary',
					size: 'small',
					onPress: () => navigation.goBack(),
				}}
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
