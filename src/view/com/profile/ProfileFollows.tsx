import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
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

export function ProfileFollows({ name, initialCount }: { name: string; initialCount?: number }) {
	const { currentAccount } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const moderationOpts = useModerationOpts();

	const onPressFindAccounts = () => {
		navigation.navigate('Search', {});
	};

	const { data: resolvedDid, isLoading: isDidLoading, error: resolveError } = useResolveDidQuery(name);
	const {
		data,
		isLoading: isFollowsLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		error,
		refetch,
	} = useProfileFollowsQuery(resolvedDid);

	const isError = !!resolveError || !!error;
	const isMe = resolvedDid === currentAccount?.did;

	const follows = data?.pages ? data.pages.flatMap((page) => page.follows) : [];

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || !!error) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more follows', { error: err });
		}
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
				sideBorders={false}
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
