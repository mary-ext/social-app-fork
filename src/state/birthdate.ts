import { useMutation, useQueryClient } from '@tanstack/react-query';

import { preferencesQueryKey } from '#/state/queries/preferences';
import { setPersonalDetails } from '#/state/queries/preferences/agent';
import { useClients } from '#/state/session';

export function useBirthdateMutation() {
	const queryClient = useQueryClient();
	const { pds } = useClients();

	return useMutation<void, unknown, { birthDate: Date }>({
		mutationFn: async ({ birthDate }: { birthDate: Date }) => {
			const bday = birthDate.toISOString();
			await setPersonalDetails(pds!, { birthDate: bday });
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
