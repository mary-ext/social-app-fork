import { useQuery } from '@tanstack/react-query';

import { MEDIA_KEY, STORED_MEDIA_KEY } from '#/state/queries/drafts/keys';

import { listDraftMedia, loadDraftMedia } from '#/features/composer/drafts/storage';

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
		queryKey: MEDIA_KEY(path),
		async queryFn() {
			return (await loadDraftMedia(path)) ?? null;
		},
		// localRef paths are unique, so a stored file never changes.
		staleTime: Infinity,
	});
};
