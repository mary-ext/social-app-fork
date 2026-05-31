import { type AppBskyActorDefs } from '@atcute/bluesky';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { preferencesQueryKey } from '#/state/queries/preferences';
import { setPostInteractionSettings } from '#/state/queries/preferences/agent';
import { useClients } from '#/state/session';

export function usePostInteractionSettingsMutation({
	onError,
	onSettled,
}: {
	onError?: (error: Error) => void;
	onSettled?: () => void;
} = {}) {
	const qc = useQueryClient();
	const { pds } = useClients();
	return useMutation({
		async mutationFn(props: AppBskyActorDefs.PostInteractionSettingsPref) {
			await setPostInteractionSettings(pds!, props);
		},
		async onSuccess() {
			await qc.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
		onError,
		onSettled,
	});
}
