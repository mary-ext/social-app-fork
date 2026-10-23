import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AppSpecificPrefs } from '#/lib/preferences/app-specific-prefs';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import { setAppSpecificPrefs } from '#/state/queries/preferences/lib/app-specific';
import { getClients } from '#/state/session';

export function useSetAppSpecificPrefsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, Partial<Omit<AppSpecificPrefs, '$type'>>>({
		mutationFn: async (patch) => {
			await setAppSpecificPrefs(pds!, patch);
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
