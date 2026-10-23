import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { useAddSavedFeedsMutation, useRemoveFeedMutation } from '#/state/queries/preferences/saved-feeds';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

/**
 * tracks whether a feed or list is in the user's saved feeds and toggles it, surfacing a toast on either
 * outcome.
 *
 * @param pin whether a freshly saved feed should also be pinned
 * @param type the saved-feed kind, `feed` for a generator or `list` for a list
 * @param uri the feed generator or list URI, matched against the saved-feeds config
 * @returns an object containing the current saved state, a pending state, and a function to toggle the save
 *   state
 */
export function useToggleSavedFeed({
	pin,
	type,
	uri,
}: {
	pin?: boolean;
	type: 'feed' | 'list';
	uri: string;
}) {
	const { data: preferences } = usePreferencesQuery();
	const { isPending: isAddPending, mutateAsync: saveFeeds } = useAddSavedFeedsMutation();
	const { isPending: isRemovePending, mutateAsync: removeFeed } = useRemoveFeedMutation();

	const savedFeedConfig = preferences?.savedFeeds?.find((feed) => feed.value === uri);

	const toggleSave = async () => {
		try {
			if (savedFeedConfig) {
				await removeFeed(savedFeedConfig);
			} else {
				await saveFeeds([{ pinned: !!pin, type, value: uri }]);
			}
			Toast.show(m['common.feeds.updatedToast']());
		} catch (err) {
			console.error('failed to update saved feeds', pin, err);
			Toast.show(m['state.feeds.error.update'](), { type: 'error' });
		}
	};

	return {
		isPending: isAddPending || isRemovePending,
		isSaved: !!savedFeedConfig,
		toggleSave,
	};
}
