import type { LabelPreference } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import {
	removeContentLabelPref,
	setAdultContentEnabled,
	setContentLabelPref,
} from '#/state/queries/preferences/lib/moderation';
import { getClients } from '#/state/session';

export function usePreferencesSetContentLabelMutation() {
	const { pds } = getClients();
	const queryClient = useQueryClient();

	return useMutation<
		void,
		unknown,
		// `visibility: undefined` clears the preference
		{ label: string; visibility: LabelPreference | undefined; labelerDid: Did | undefined }
	>({
		mutationFn: async ({ label, visibility, labelerDid }) => {
			if (visibility === undefined) {
				await removeContentLabelPref(pds!, label, labelerDid);
			} else {
				await setContentLabelPref(pds!, label, visibility, labelerDid);
			}
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function usePreferencesSetAdultContentMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation<void, unknown, { enabled: boolean }>({
		mutationFn: async ({ enabled }) => {
			await setAdultContentEnabled(pds!, enabled);
			// triggers a refetch
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
