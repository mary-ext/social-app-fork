import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type InteractionSettings, interactionSettingsToPreferences } from '#/lib/interaction-settings';

import { preferencesQueryKey } from '#/state/queries/preferences';
import { setPostInteractionSettings } from '#/state/queries/preferences/agent';
import { getClients } from '#/state/session';

/**
 * saves the account's default interaction settings for new posts.
 *
 * @returns a mutation accepting reply and quote settings
 */
export function usePostInteractionSettingsMutation() {
	const qc = useQueryClient();
	const { pds } = getClients();
	return useMutation({
		async mutationFn(settings: InteractionSettings) {
			await setPostInteractionSettings(pds!, interactionSettingsToPreferences(settings));
		},
		async onSuccess() {
			await qc.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
