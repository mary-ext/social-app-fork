import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { mapDefined } from '@mary/array-fns';

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
	listUri: ResourceUri;
	moderationOpts: ModerationOptions;
}

export function ProfilesList({ listUri, moderationOpts }: ProfilesListProps) {
	const { currentAccount } = useSession();
	const { data, refetch, isError } = useAllListMembersQuery(listUri);

	if (!data) {
		return <ListMaybePlaceholder isLoading={true} isError={isError} onRetry={refetch} />;
	}

	// the server returns these sorted by descending creation date, so we invert to show oldest first
	let profiles = mapDefined(data, (p) => {
		const profile = p.subject;
		if (profile === undefined || isBlockedOrBlocking(profile) || profile.associated?.labeler) {
			return;
		}

		return profile;
	})
		// oxlint-disable-next-line unicorn/no-array-reverse -- reversing the array `mapDefined` just returned
		.reverse();

	// on our own list, float ourselves to the top
	if (parseCanonicalResourceUri(listUri).repo === currentAccount?.did) {
		const myIndex = profiles.findIndex((p) => p.did === currentAccount?.did);
		const myProfile = profiles[myIndex];
		if (myProfile !== undefined) {
			profiles = [myProfile, ...profiles.slice(0, myIndex), ...profiles.slice(myIndex + 1)];
		}
	}

	return (
		<List
			data={profiles}
			renderItem={({ index, item }) => (
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item} topBorder={index !== 0} />
			)}
			keyExtractor={keyExtractor}
			ListFooterComponent={<ListFooter />}
		/>
	);
}
