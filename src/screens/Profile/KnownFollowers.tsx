import { useMemo, useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useProfileKnownFollowersQuery } from '#/state/queries/known-followers';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';

import { logger } from '#/logger';

import { ProfileCardWithFollowBtn } from '#/view/com/profile/ProfileCard';
import { List } from '#/view/com/util/List';
import { ViewHeader } from '#/view/com/util/ViewHeader';

import * as Layout from '#/components/Layout';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';

import { m } from '#/paraglide/messages';

function renderItem({ item, index }: { item: AppBskyActorDefs.ProfileView; index: number }) {
	return <ProfileCardWithFollowBtn key={item.did} profile={item} noBorder={index === 0} />;
}

function keyExtractor(item: { did: string }) {
	return item.did;
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileKnownFollowers'>;
export const ProfileKnownFollowersScreen = ({ route }: Props) => {
	const initialNumToRender = useInitialNumToRender();

	const { name } = route.params;

	const [isPTRing, setIsPTRing] = useState(false);
	const {
		data: resolvedDid,
		isLoading: isDidLoading,
		error: resolveError,
	} = useResolveDidQuery(route.params.name);
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

	const onRefresh = async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh followers', { message: err });
		}
		setIsPTRing(false);
	};

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || !!error) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more followers', { message: err });
		}
	};

	const followers = useMemo(() => {
		if (data?.pages) {
			return data.pages.flatMap((page) => page.followers);
		}
		return [];
	}, [data]);

	const isError = Boolean(resolveError || error);

	if (followers.length < 1) {
		return (
			<Layout.Screen>
				<ViewHeader title={m['common.follow.followersYouKnow']()} />
				<ListMaybePlaceholder
					isLoading={isDidLoading || isFollowersLoading}
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
			<ViewHeader title={m['common.follow.followersYouKnow']()} />
			<List
				data={followers}
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
		</Layout.Screen>
	);
};
