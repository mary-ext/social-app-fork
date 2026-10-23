import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { BskyFeedViewPreference } from '#/lib/moderation/preferences-types';
import type { ThreadViewPreferences } from '#/lib/preferences/types';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import { setFeedViewPrefs, setThreadViewPrefs } from '#/state/queries/preferences/lib/view';
import { getClients } from '#/state/session';

export function useSetFeedViewPreferencesMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, Partial<BskyFeedViewPreference>>({
		mutationFn: async (prefs) => {
			/*
			 * special handling here, merged into `feedViewPrefs` above, since
			 * following was previously called `home`
			 */
			await setFeedViewPrefs(pds!, 'home', prefs);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useSetThreadViewPreferencesMutation({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: void, variables: Partial<ThreadViewPreferences>) => void;
	onError?: (error: unknown) => void;
}) {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, Partial<ThreadViewPreferences>>({
		mutationFn: async (prefs) => {
			await setThreadViewPrefs(pds!, prefs);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
		onSuccess,
		onError,
	});
}
