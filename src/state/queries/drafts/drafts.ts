import { ok } from '@atcute/client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { LIST_KEY } from '#/state/queries/drafts/keys';
import { getClients } from '#/state/session';

/**
 * lists the account's drafts, most recently updated first.
 *
 * @returns the paginated drafts query
 */
export const useDraftsQuery = () => {
	const { appview } = getClients();

	return useInfiniteQuery({
		queryKey: LIST_KEY,
		async queryFn({ pageParam, signal }) {
			const res = await ok(
				appview.get('app.bsky.draft.getDrafts', { signal, params: { cursor: pageParam } }),
			);
			return { cursor: res.cursor, drafts: res.drafts };
		},
		initialPageParam: undefined as string | undefined,
		// an empty cursor marks the last page.
		getNextPageParam: (page) => page.cursor || undefined,
	});
};
