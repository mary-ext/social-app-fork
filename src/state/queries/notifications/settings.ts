import type { AppBskyNotificationDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { t } from '@lingui/core/macro';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';

const RQKEY_ROOT = 'notification-settings';
const RQKEY = [RQKEY_ROOT];

export function useNotificationSettingsQuery({ enabled }: { enabled?: boolean } = {}) {
	const { appview } = useClients();

	return useQuery({
		queryKey: RQKEY,
		queryFn: async () => {
			const data = await ok(appview.get('app.bsky.notification.getPreferences', { params: {} }));
			return data.preferences;
		},
		enabled,
	});
}
export function useNotificationSettingsUpdateMutation() {
	const { appview } = useClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (update: Partial<AppBskyNotificationDefs.Preferences>) => {
			const data = await ok(appview.post('app.bsky.notification.putPreferencesV2', { input: update }));
			return data.preferences;
		},
		onMutate: (update) => {
			optimisticUpdateNotificationSettings(queryClient, update);
		},
		onError: (e) => {
			logger.error('Could not update notification settings', { message: e });
			queryClient.invalidateQueries({ queryKey: RQKEY });
			Toast.show(t`Could not update notification settings`, {
				type: 'error',
			});
		},
	});
}

function optimisticUpdateNotificationSettings(
	queryClient: QueryClient,
	update: Partial<AppBskyNotificationDefs.Preferences>,
) {
	queryClient.setQueryData(RQKEY, (old?: AppBskyNotificationDefs.Preferences) => {
		if (!old) return old;
		return { ...old, ...update };
	});
}
