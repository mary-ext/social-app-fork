import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import { setVerificationPrefs } from '#/state/queries/preferences/lib/account';
import { getClients } from '#/state/session';

export function useSetVerificationPrefsMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, AppBskyActorDefs.VerificationPrefs>({
		mutationFn: async (prefs) => {
			await setVerificationPrefs(pds!, prefs);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
