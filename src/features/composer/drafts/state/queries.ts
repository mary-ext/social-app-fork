import type { AppBskyDraftDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getDeviceId } from '#/state/preferences/device-id';
import { getClients } from '#/state/session';

import type { ComposerState } from '#/features/composer/state/composer';

import { composerStateToDraft, draftViewToSummary, extractLocalRefs } from './api';
import * as storage from './storage';

const DRAFTS_QUERY_KEY = ['drafts'];

/** Hook to list all drafts for the current account */
export function useDraftsQuery() {
	const { appview } = getClients();

	return useInfiniteQuery({
		queryKey: DRAFTS_QUERY_KEY,
		queryFn: async ({ pageParam, signal }) => {
			// Ensure media cache is populated before checking which media exists
			await storage.ensureMediaCachePopulated();
			const res = await ok(
				appview.get('app.bsky.draft.getDrafts', { signal, params: { cursor: pageParam } }),
			);
			return {
				cursor: res.cursor,
				drafts: res.drafts.map((view) =>
					draftViewToSummary({
						view,
					}),
				),
			};
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.cursor || undefined,
	});
}

/**
 * Load a draft's local media for editing. Takes the full Draft object (from DraftSummary) to avoid
 * re-fetching.
 */
export async function loadDraftMedia(draft: AppBskyDraftDefs.Draft): Promise<{
	loadedMedia: Map<string, Blob>;
}> {
	// Load local media files
	const loadedMedia = new Map<string, Blob>();

	// can't load media from another device
	if (draft.deviceId && draft.deviceId !== getDeviceId()) {
		return { loadedMedia };
	}

	await Promise.all(
		[...extractLocalRefs(draft)].map(async (path) => {
			try {
				loadedMedia.set(path, await storage.loadMediaFromLocal(path));
			} catch (e) {
				console.error('Failed to load draft media', path, e);
			}
		}),
	);

	return { loadedMedia };
}

/** hook to save a draft */
export function useSaveDraftMutation() {
	const { appview } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			composerState,
			existingDraftId,
		}: {
			composerState: ComposerState;
			existingDraftId?: string;
		}): Promise<{
			draftId: string;
			localRefPaths: Map<string, Blob>;
			originalLocalRefs: Set<string> | undefined;
		}> => {
			// Convert composer state to server draft format
			const { draft, localRefPaths } = await composerStateToDraft(composerState);

			// 1. NETWORK FIRST - Update/create server draft
			let draftId: string;
			if (existingDraftId) {
				await ok(
					appview.post('app.bsky.draft.updateDraft', {
						as: null,
						input: {
							draft: {
								draft,
								id: existingDraftId,
							},
						},
					}),
				);
				draftId = existingDraftId;
			} else {
				const res = await ok(appview.post('app.bsky.draft.createDraft', { input: { draft } }));
				draftId = res.id;
			}

			// Return data needed for onSuccess
			return {
				draftId,
				localRefPaths,
				originalLocalRefs: composerState.originalLocalRefs,
			};
		},
		onSuccess: async ({ localRefPaths, originalLocalRefs }) => {
			// Save new/changed media files
			await Promise.all(
				[...localRefPaths].map(async ([localRefPath, blob]) => {
					// Only save if this media doesn't already exist (reusing localRefPath)
					if (storage.mediaExists(localRefPath)) {
						return;
					}
					await storage.saveMediaToLocal(localRefPath, blob);
				}),
			);

			// Delete orphaned media (old refs not in new)
			if (originalLocalRefs) {
				const newLocalRefs = new Set(localRefPaths.keys());
				await Promise.all(
					[...originalLocalRefs]
						.filter((oldRef) => !newLocalRefs.has(oldRef))
						.map((oldRef) => {
							return storage.deleteMediaFromLocal(oldRef);
						}),
				);
			}

			await queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
		},
	});
}

/** Hook to delete a draft. Takes the full draft data to avoid re-fetching for media cleanup. */
export function useDeleteDraftMutation() {
	const { appview } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ draftId }: { draftId: string; draft: AppBskyDraftDefs.Draft }) => {
			// Delete from server first - if this fails, we keep local media for retry
			await ok(appview.post('app.bsky.draft.deleteDraft', { as: null, input: { id: draftId } }));
		},
		onSuccess: async (_, { draft }) => {
			// Only delete local media after server deletion succeeds
			const paths = draft.posts.flatMap((post) => [
				...(post.embedImages ?? []).map((img) => img.localRef.path),
				...(post.embedGallery?.items ?? []).map((item) => item.localRef.path),
				...(post.embedVideos ?? []).map((vid) => vid.localRef.path),
			]);

			await Promise.all(paths.map((path) => storage.deleteMediaFromLocal(path)));
			void queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
		},
	});
}

/**
 * cleans up a draft after it has been published by deleting it from the server and removing all associated
 * local media.
 *
 * @param draftId the ID of the draft to delete
 * @param originalLocalRefs local media references associated with the draft
 */
export function useCleanupPublishedDraftMutation() {
	const { appview } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ draftId }: { draftId: string; originalLocalRefs: Set<string> }) => {
			// Delete from server first
			await ok(appview.post('app.bsky.draft.deleteDraft', { as: null, input: { id: draftId } }));
		},
		onSuccess: async (_, { originalLocalRefs }) => {
			// Delete all local media files for this draft
			await Promise.all(
				[...originalLocalRefs].map((localRef) => {
					return storage.deleteMediaFromLocal(localRef);
				}),
			);
			void queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
		},
	});
}
