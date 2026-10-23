import { ok } from '@atcute/client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { InteractionSettings } from '#/lib/interaction-settings';

import { LISTING_KEYS } from '#/state/queries/drafts/keys';
import { useGetPost } from '#/state/queries/post/post';
import { getClients } from '#/state/session';

import type { Composer } from '#/features/composer/context';
import { serializeDraft } from '#/features/composer/drafts/serialize';
import { deleteDraftMedia, saveDraftMedia } from '#/features/composer/drafts/storage';

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
