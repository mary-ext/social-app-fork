import { useCallback, useMemo, useState } from 'react';
import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';
import { useNavigation } from '@react-navigation/native';

import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import type { NavigationProp } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { PeopleRemove2_Stroke1_Corner0_Rounded as PeopleRemoveIcon } from '#/components/icons/PeopleRemove2';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';

import { m } from '#/paraglide/messages';

import { List } from '../util/List';
import { ProfileCardWithFollowBtn } from './ProfileCard';

function renderItem({ item, index }: { item: ActorDefs.ProfileView; index: number }) {
	return <ProfileCardWithFollowBtn key={item.did} profile={item} noBorder={index === 0} />;
}

function keyExtractor(item: { did: string }) {
	return item.did;
}

export function ProfileFollows({ name }: { name: string }) {
	const initialNumToRender = useInitialNumToRender();
	const { currentAccount } = useSession();
	const navigation = useNavigation<NavigationProp>();

	const onPressFindAccounts = useCallback(() => {
		navigation.navigate('Search', {});
	}, [navigation]);

	const [isPTRing, setIsPTRing] = useState(false);
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

	const follows = useMemo(() => {
		if (data?.pages) {
			return data.pages.flatMap((page) => page.follows);
		}
		return [];
	}, [data]);

	const onRefresh = useCallback(async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh follows', { error: err });
		}
		setIsPTRing(false);
	}, [refetch, setIsPTRing]);

	const onEndReached = useCallback(async () => {
		if (isFetchingNextPage || !hasNextPage || !!error) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more follows', { error: err });
		}
	}, [isFetchingNextPage, hasNextPage, error, fetchNextPage]);

	if (follows.length < 1) {
		return (
			<ListMaybePlaceholder
				isLoading={isDidLoading || isFollowsLoading}
				isError={isError}
				emptyType="results"
				emptyMessage={
					isMe ? m['view.profile.empty.notFollowingYou']() : m['view.profile.empty.notFollowingUser']()
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
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			refreshing={isPTRing}
			onRefresh={() => void onRefresh()}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={4}
			ListFooterComponent={
				<ListFooter
					isFetchingNextPage={isFetchingNextPage}
					error={cleanError(error)}
					onRetry={fetchNextPage}
				/>
			}
			// @ts-ignore our .web version only -prf
			desktopFixedHeight
			initialNumToRender={initialNumToRender}
			windowSize={11}
			sideBorders={false}
		/>
	);
}
