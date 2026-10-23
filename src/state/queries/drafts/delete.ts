import type { AppBskyDraftDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { LISTING_KEYS } from '#/state/queries/drafts/keys';
import { getClients } from '#/state/session';

import type { DraftOrigin } from '#/features/composer/context';
import { getDraftMediaPaths } from '#/features/composer/drafts/draft-format';
import { deleteDraftMedia } from '#/features/composer/drafts/storage';

const deleteDraft = async (
	queryClient: QueryClient,
	id: string,
	mediaPaths: Iterable<string>,
): Promise<void> => {
	const { appview } = getClients();

	await ok(appview.post('app.bsky.draft.deleteDraft', { as: null, input: { id } }));
	// failed deletions must leave the draft's attachments usable.
	await Promise.all(Array.from(mediaPaths, deleteDraftMedia));
	await Promise.all(LISTING_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};

/**
 * deletes a published draft and its local attachments.
 *
 * @param queryClient the query client holding draft listings
 * @param origin the draft the composer was restored from
 * @returns resolves after deletion and draft listing invalidation
 */
export const deletePublishedDraft = (queryClient: QueryClient, origin: DraftOrigin): Promise<void> => {
	return deleteDraft(queryClient, origin.id, origin.mediaPaths.values());
};

/**
 * deletes a draft and its attachments on this device.
 *
 * @returns the mutation, taking the draft's view
 */
export const useDeleteDraftMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn(view: AppBskyDraftDefs.DraftView) {
			return deleteDraft(queryClient, view.id, getDraftMediaPaths(view.draft));
		},
	});
};
