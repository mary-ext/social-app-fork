import type { ReactNode } from 'react';

import type { Did } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';

import { useProfileListsQuery } from '#/state/queries/profile-lists';
import { useSession } from '#/state/session';

import { List } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';
import * as ListCard from '#/components/ListCard';

import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

const LIST_ITEM_HEIGHT_ESTIMATE = 120;

interface ProfileListsProps {
	did: Did;
	listCount?: number;
}

export function ProfileLists({ did, listCount }: ProfileListsProps): ReactNode {
	const { data, error, fetchNextPage, isError, isFetchingNextPage, isPending, refetch } =
		useProfileListsQuery(did);
	const router = useRouter();
	const { currentAccount } = useSession();
	const isSelf = currentAccount?.did === did;

	const lists = data?.pages.flatMap((page) => page.lists) ?? [];

	if (lists.length < 1) {
		if (isError) {
			return <ListError hideBackButton message={cleanError(error)} onRetry={() => void refetch()} />;
		}

		if (isPending) {
			return <ListCard.LoadingPlaceholder count={listCount} />;
		}

		return (
			<ListEmpty
				icon={ListIcon}
				message={isSelf ? m['common.list.empty']() : m['common.list.emptyUser']()}
				button={
					isSelf
						? {
								label: m['common.list.create'](),
								text: m['common.list.create'](),
								onPress: () => router.navigate({ to: { name: 'Lists' } }),
								size: 'small',
								color: 'primary',
							}
						: undefined
				}
			/>
		);
	}

	return (
		<List
			data={lists}
			estimateHeight={LIST_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			renderItem={({ index, item }) => <ListCard.Default view={item} topBorder={index !== 0} />}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			onEndReached={() => void fetchNextPage()}
			onEndReachedThreshold={2}
		/>
	);
}
