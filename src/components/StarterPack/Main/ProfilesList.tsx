import { useState } from 'react';
import { type ListRenderItemInfo, View } from 'react-native';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';

import { useAllListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';

import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { Default as ProfileCard } from '#/components/ProfileCard';

function keyExtractor(item: { did: string }, index: number) {
	return `${item.did}-${index}`;
}

interface ProfilesListProps {
	listUri: string;
	moderationOpts: ModerationOptions;
}

export function ProfilesList({ listUri, moderationOpts }: ProfilesListProps) {
	const t = useTheme();
	const bottomBarOffset = useBottomBarOffset();
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
	const isOwn = parseCanonicalResourceUri(listUri).repo === currentAccount?.did;

	const getSortedProfiles = () => {
		if (!profiles) return;
		if (!isOwn) return profiles;

		const myIndex = profiles.findIndex((p) => p.did === currentAccount?.did);
		const myProfile = profiles[myIndex];
		return myIndex !== -1 && myProfile
			? [myProfile, ...profiles.slice(0, myIndex), ...profiles.slice(myIndex + 1)]
			: profiles;
	};

	const onRefresh = async () => {
		setIsPTRing(true);
		await refetch();
		setIsPTRing(false);
	};

	const renderItem = ({ item }: ListRenderItemInfo<AppBskyActorDefs.ProfileView>) => {
		return (
			<View style={[a.p_lg, t.atoms.border_contrast_low, a.border_t]}>
				<ProfileCard profile={item} moderationOpts={moderationOpts} />
			</View>
		);
	};

	if (!data) {
		return (
			<View style={[a.h_full_vh, { marginBottom: bottomBarOffset }]}>
				<ListMaybePlaceholder isLoading={true} isError={isError} onRetry={refetch} />
			</View>
		);
	}

	return (
		<List
			data={getSortedProfiles()}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			ListFooterComponent={<ListFooter style={{ paddingBottom: bottomBarOffset, borderTopWidth: 0 }} />}
			showsVerticalScrollIndicator={false}
			desktopFixedHeight
			initialNumToRender={initialNumToRender}
			refreshing={isPTRing}
			onRefresh={() => void onRefresh()}
		/>
	);
}
