import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useInfiniteQuery } from '@tanstack/react-query';

import { createQueryKey } from '#/state/queries/util';
import { useClients } from '#/state/session';

const listMutualGroupsQueryKeyRoot = 'list-mutual-groups';

export const createListMutualGroupsQueryKey = (args: { subject: string }) =>
	createQueryKey(listMutualGroupsQueryKeyRoot, args);

export function useListMutualGroupsQuery({
	subject,
	enabled,
	limit = 20,
}: {
	subject: string | undefined;
	enabled?: boolean;
	limit?: number;
}) {
	const { chat } = useClients();
	const isEnabled = enabled !== false && !!subject;

	return useInfiniteQuery({
		gcTime: 0,
		staleTime: 0,
		enabled: isEnabled,
		queryKey: createListMutualGroupsQueryKey({ subject: subject ?? '' }),
		queryFn: async ({ pageParam }) => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.get('chat.bsky.group.listMutualGroups', {
					params: { subject: subject! as Did, cursor: pageParam, limit },
				}),
			);
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.cursor,
	});
}
