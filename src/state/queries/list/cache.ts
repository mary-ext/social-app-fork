import type { QueryClient } from '@tanstack/react-query';

import {
	MEMBERS_ALL_RQKEY,
	MEMBERS_RQKEY,
	MY_LISTS_RQKEY,
	MY_LISTS_RQKEY_ROOT,
} from '#/state/queries/list/keys';
import type { MyListsFilter } from '#/state/queries/list/my-lists';

export async function invalidateListMembersQuery({
	queryClient,
	uri,
}: {
	queryClient: QueryClient;
	uri: string;
}) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: MEMBERS_RQKEY(uri) }),
		queryClient.invalidateQueries({ queryKey: MEMBERS_ALL_RQKEY(uri) }),
	]);
}

export function invalidateMyLists(qc: QueryClient, filter?: MyListsFilter) {
	if (filter) {
		void qc.invalidateQueries({ queryKey: MY_LISTS_RQKEY(filter) });
	} else {
		void qc.invalidateQueries({ queryKey: [MY_LISTS_RQKEY_ROOT] });
	}
}
