import type { AppBskyDraftDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getClients } from '#/state/session';

import { getDraftMediaPaths } from './draft-format';
import { deleteDraftMedia, listDraftMedia, loadDraftMedia } from './storage';

// nested under the previous composer's key so its saves refresh this list too.
const DRAFTS_QUERY_KEY = ['drafts', 'thread'];
const STORED_MEDIA_QUERY_KEY = [...DRAFTS_QUERY_KEY, 'stored-media'];

/**
 * lists the account's drafts, most recently updated first.
 *
 * @returns the paginated drafts query
 */
export const useDraftsQuery = () => {
	const { appview } = getClients();

	return useInfiniteQuery({
		queryKey: DRAFTS_QUERY_KEY,
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

/**
 * lists the draft attachments stored on this device.
 *
 * @returns the query, resolving to the attachments' localRef paths
 */
export const useStoredDraftMediaQuery = () => {
	return useQuery({
		queryKey: STORED_MEDIA_QUERY_KEY,
		queryFn: listDraftMedia,
	});
};

/**
 * reads a draft attachment stored on this device.
 *
 * @param path the attachment's localRef path
 * @returns the query, resolving to the file or null if it isn't stored
 */
export const useDraftMediaQuery = (path: string) => {
	return useQuery({
		queryKey: ['draft-media', path],
		async queryFn() {
			return (await loadDraftMedia(path)) ?? null;
		},
		// localRef paths are unique, so a stored file never changes.
		staleTime: Infinity,
	});
};

/**
 * deletes a draft and its attachments on this device.
 *
 * @returns the mutation, taking the draft's view
 */
export const useDeleteDraftMutation = () => {
	const { appview } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		async mutationFn(view: AppBskyDraftDefs.DraftView) {
			await ok(appview.post('app.bsky.draft.deleteDraft', { as: null, input: { id: view.id } }));
		},
		async onSuccess(_, view) {
			// failed deletions must leave the draft's attachments usable.
			await Promise.all(getDraftMediaPaths(view.draft).map(deleteDraftMedia));
			await queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
		},
	});
};
