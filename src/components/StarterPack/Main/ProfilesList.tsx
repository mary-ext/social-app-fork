import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';

import { useAllListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as ProfileCard from '#/components/web/ProfileCard';

function keyExtractor(item: AppBskyActorDefs.ProfileView, index: number) {
	return `${item.did}-${index}`;
}

interface ProfilesListProps {
	listUri: string;
	moderationOpts: ModerationOptions;
}

export function ProfilesList({ listUri, moderationOpts }: ProfilesListProps) {
	const { currentAccount } = useSession();
	const { data, refetch, isError } = useAllListMembersQuery(listUri);

	// the server returns these sorted by descending creation date, so we invert to show oldest first
	const profiles = data
		?.map((p) => p.subject)
		.filter(
			(profile): profile is AppBskyActorDefs.ProfileView =>
				profile !== undefined && !isBlockedOrBlocking(profile) && !profile.associated?.labeler,
		)
		// oxlint-disable-next-line unicorn/no-array-reverse -- reversing the array `filter` just returned
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

	if (!data) {
		return <ListMaybePlaceholder isLoading={true} isError={isError} onRetry={refetch} />;
	}

	return (
		<List
			data={getSortedProfiles()}
			renderItem={({ index, item }) => (
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item} topBorder={index !== 0} />
			)}
			keyExtractor={keyExtractor}
			ListFooterComponent={<ListFooter />}
		/>
	);
}
