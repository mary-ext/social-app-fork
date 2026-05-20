import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { type ListRenderItemInfo, View } from 'react-native';
import { type AppBskyActorDefs, type AppBskyGraphGetList, AtUri, type ModerationOpts } from '@atproto/api';
import { type InfiniteData, type UseInfiniteQueryResult } from '@tanstack/react-query';

import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';
import { useAllListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';
import { List, type ListRef } from '#/view/com/util/List';
import { type SectionRef } from '#/screens/Profile/Sections/types';
import { atoms as a, useTheme } from '#/alf';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { Default as ProfileCard } from '#/components/ProfileCard';

function keyExtractor(item: { did: string }, index: number) {
	return `${item.did}-${index}`;
}

interface ProfilesListProps {
	listUri: string;
	listMembersQuery: UseInfiniteQueryResult<InfiniteData<AppBskyGraphGetList.OutputSchema>>;
	moderationOpts: ModerationOpts;
	headerHeight: number;
	scrollElRef: ListRef;
}

export const ProfilesList = forwardRef<SectionRef, ProfilesListProps>(function ProfilesListImpl(
	{ listUri, moderationOpts, headerHeight, scrollElRef },
	ref,
) {
	const t = useTheme();
	const bottomBarOffset = useBottomBarOffset(headerHeight);
	const initialNumToRender = useInitialNumToRender();
	const { currentAccount } = useSession();
	const { data, refetch, isError } = useAllListMembersQuery(listUri);

	const [isPTRing, setIsPTRing] = useState(false);

	// The server returns these sorted by descending creation date, so we want to invert

	const profiles = data
		?.map((p) => p.subject)
		.filter(
			(profile): profile is AppBskyActorDefs.ProfileView =>
				profile !== undefined && !isBlockedOrBlocking(profile) && !profile.associated?.labeler,
		)
		.reverse();
	const isOwn = new AtUri(listUri).host === currentAccount?.did;

	const getSortedProfiles = () => {
		if (!profiles) return;
		if (!isOwn) return profiles;

		const myIndex = profiles.findIndex((p) => p.did === currentAccount?.did);
		const myProfile = profiles[myIndex];
		return myIndex !== -1 && myProfile
			? [myProfile, ...profiles.slice(0, myIndex), ...profiles.slice(myIndex + 1)]
			: profiles;
	};
	const onScrollToTop = useCallback(() => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: -headerHeight,
		});
	}, [scrollElRef, headerHeight]);

	useImperativeHandle(ref, () => ({
		scrollToTop: onScrollToTop,
	}));

	const renderItem = ({ item }: ListRenderItemInfo<AppBskyActorDefs.ProfileView>) => {
		return (
			<View style={[a.p_lg, t.atoms.border_contrast_low, a.border_t]}>
				<ProfileCard profile={item} moderationOpts={moderationOpts} logContext="StarterPackProfilesList" />
			</View>
		);
	};

	if (!data) {
		return (
			<View style={[a.h_full_vh, { marginTop: headerHeight, marginBottom: bottomBarOffset }]}>
				<ListMaybePlaceholder isLoading={true} isError={isError} onRetry={refetch} />
			</View>
		);
	}

	if (data)
		return (
			<List
				data={getSortedProfiles()}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ref={scrollElRef}
				headerOffset={headerHeight}
				ListFooterComponent={<ListFooter style={{ paddingBottom: bottomBarOffset, borderTopWidth: 0 }} />}
				showsVerticalScrollIndicator={false}
				desktopFixedHeight
				initialNumToRender={initialNumToRender}
				refreshing={isPTRing}
				onRefresh={async () => {
					setIsPTRing(true);
					await refetch();
					setIsPTRing(false);
				}}
			/>
		);
});
