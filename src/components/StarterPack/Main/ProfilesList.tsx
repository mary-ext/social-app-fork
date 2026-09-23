import type { AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { cleanError } from '#/lib/errors';
import { isBlockedOrBlocking } from '#/lib/moderation/blocked-and-muted';

import { useAllListMembersQuery } from '#/state/queries/list-members';
import { useListMembershipRemoveMutation } from '#/state/queries/list-memberships';
import { useSession } from '#/state/session';

import { ErrorState } from '#/components/ErrorState';
import { List } from '#/components/List/List';
import { ListLoading } from '#/components/List/ListLoading';
import * as ListTail from '#/components/List/ListTail';
import { Notice } from '#/components/Notice';
import * as Toast from '#/components/Toast';
import { InlineButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

function keyExtractor(item: AppBskyGraphDefs.ListItemView) {
	return item.uri;
}

interface ProfilesListProps {
	listUri: ResourceUri;
	moderationOpts: ModerationOptions;
}

export function ProfilesList({ listUri, moderationOpts }: ProfilesListProps) {
	const { currentAccount } = useSession();
	const { data, isError, isPending, refetch } = useAllListMembersQuery(listUri);

	if (!data) {
		if (isError) {
			return <ErrorState onRetry={() => void refetch()} />;
		}

		return isPending ? <ListLoading /> : null;
	}

	const isOwn = parseCanonicalResourceUri(listUri).repo === currentAccount?.did;

	// the server returns these sorted by descending creation date, so we invert to show oldest first
	const items = data
		.filter((item) => !isBlockedOrBlocking(item.subject) && !item.subject.associated?.labeler)
		// oxlint-disable-next-line unicorn/no-array-reverse -- reversing the array `filter` just returned
		.reverse()
		// put opted-out members first for review, then ourselves if we own the list.
		// oxlint-disable-next-line unicorn/no-array-sort -- sorting the array `filter` just returned
		.sort((a, b) => {
			if (!!a.subjectOptedOut !== !!b.subjectOptedOut) {
				return a.subjectOptedOut ? -1 : 1;
			}
			if (isOwn) {
				if (a.subject.did === currentAccount?.did) {
					return -1;
				}
				if (b.subject.did === currentAccount?.did) {
					return 1;
				}
			}
			return 0;
		});

	return (
		<List
			data={items}
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			renderItem={({ index, item }) => (
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item.subject} topBorder={index !== 0}>
					{item.subjectOptedOut && <OptedOutNotice canRemove={isOwn} item={item} listUri={listUri} />}
				</ProfileCard.Default>
			)}
			ListFooterComponent={<ListTail.Frame />}
		/>
	);
}

function OptedOutNotice({
	canRemove,
	item,
	listUri,
}: {
	canRemove: boolean;
	item: AppBskyGraphDefs.ListItemView;
	listUri: ResourceUri;
}) {
	const { mutate: removeMembership, isPending } = useListMembershipRemoveMutation({
		onSuccess: () => {
			Toast.show(m['components.starterPack.optOut.removedToast']());
		},
		onError: (error) => {
			Toast.show(cleanError(error), { type: 'error' });
		},
	});

	return (
		<Notice
			icon={CircleInfo}
			role="status"
			actions={
				canRemove && (
					<InlineButton
						disabled={isPending}
						label={m['components.starterPack.optOut.remove.a11y']({ name: item.subject.handle })}
						onClick={() => {
							removeMembership({ listUri, actorDid: item.subject.did, membershipUri: item.uri });
						}}
						size="md_sub"
						weight="semiBold"
					>
						{m['common.action.remove']()}
					</InlineButton>
				)
			}
		>
			{m['components.starterPack.optOut.notice']()}
		</Notice>
	);
}
