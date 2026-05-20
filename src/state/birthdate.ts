import { useMutation, useQueryClient } from '@tanstack/react-query';

import { preferencesQueryKey } from '#/state/queries/preferences';
import { useAgent } from '#/state/session';

export function useBirthdateMutation() {
	const queryClient = useQueryClient();
	const agent = useAgent();

	return useMutation<void, unknown, { birthDate: Date }>({
		mutationFn: async ({ birthDate }: { birthDate: Date }) => {
			const bday = birthDate.toISOString();
			await agent.setPersonalDetails({ birthDate: bday });
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
