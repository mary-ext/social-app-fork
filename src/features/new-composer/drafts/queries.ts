import type { AppBskyDraftDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { InteractionSettings } from '#/lib/interaction-settings';

import { useGetPost } from '#/state/queries/post';
import { getClients } from '#/state/session';

import type { Composer } from '../context';
import { getDraftMediaPaths } from './draft-format';
import { serializeDraft } from './serialize';
import { deleteDraftMedia, listDraftMedia, loadDraftMedia, saveDraftMedia } from './storage';

const DRAFTS_KEY = ['thread-drafts'];
const LIST_KEY = [...DRAFTS_KEY, 'list'];
const STORED_MEDIA_KEY = [...DRAFTS_KEY, 'stored-media'];

// unique media paths keep individual file queries valid across saves.
const LISTING_KEYS = [LIST_KEY, STORED_MEDIA_KEY];

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

/**
 * lists the draft attachments stored on this device.
 *
 * @returns the query, resolving to the attachments' localRef paths
 */
export const useStoredDraftMediaQuery = () => {
	return useQuery({
		queryKey: STORED_MEDIA_KEY,
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
		queryKey: [...DRAFTS_KEY, 'media', path],
		async queryFn() {
			return (await loadDraftMedia(path)) ?? null;
		},
		// localRef paths are unique, so a stored file never changes.
		staleTime: Infinity,
	});
};

/**
 * creates a draft or updates the one the composer was restored from.
 *
 * @returns the mutation, taking the composer and its resolved interaction settings
 */
export const useSaveDraftMutation = () => {
	const { appview } = getClients();
	const queryClient = useQueryClient();
	const getPost = useGetPost();

	return useMutation({
		async mutationFn({ composer, interaction }: { composer: Composer; interaction: InteractionSettings }) {
			const origin = composer.draft;
			const previous = new Set(origin?.mediaPaths.values());

			const { draft, files } = await serializeDraft(composer.wg.state, {
				getPost,
				interaction,
				mediaPaths: origin?.mediaPaths ?? new Map(),
				queryClient,
			});

			const added = files
				.entries()
				.filter(([path]) => !previous.has(path))
				.toArray();

			// store new attachments before saving their references.
			try {
				await Promise.all(added.map(([path, blob]) => saveDraftMedia(path, blob)));

				if (origin) {
					await ok(
						appview.post('app.bsky.draft.updateDraft', {
							as: null,
							input: { draft: { id: origin.id, draft } },
						}),
					);
				} else {
					await ok(appview.post('app.bsky.draft.createDraft', { input: { draft } }));
				}
			} catch (err) {
				await Promise.allSettled(added.map(([path]) => deleteDraftMedia(path)));
				throw err;
			}

			// cleanup failures must not report a successful save as failed.
			await Promise.allSettled(
				previous
					.values()
					.filter((path) => !files.has(path))
					.map(deleteDraftMedia),
			);
		},
		onSuccess() {
			// remove cached listings to prevent restoring stale drafts while refetching.
			for (const queryKey of LISTING_KEYS) {
				queryClient.removeQueries({ queryKey });
			}
		},
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
			await Promise.all(LISTING_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
		},
	});
};
