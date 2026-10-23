import type { AppBskyNotificationDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import type {
	AppNotificationSettingsPreferences,
	ChatNotificationSettingsPreferences,
	NotificationSettingsPreferences,
} from '#/lib/notifications/settings';

import {
	NOTIFICATION_SETTINGS_APP_RQKEY,
	NOTIFICATION_SETTINGS_CHAT_RQKEY,
} from '#/state/queries/notifications/keys';
import { getClients } from '#/state/session';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

type NotificationSettingsUpdate = Partial<NotificationSettingsPreferences>;
type AppNotificationSettingsUpdate = Partial<Omit<AppBskyNotificationDefs.Preferences, '$type' | 'chat'>>;
type ChatNotificationSettingsUpdate = Partial<ChatNotificationSettingsPreferences>;

export function useNotificationSettingsUpdateMutation() {
	const { appview, chat } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (update: NotificationSettingsUpdate) => {
			const { appUpdate, chatUpdate } = splitNotificationSettingsUpdate(update);
			await Promise.all([
				hasUpdates(appUpdate)
					? ok(appview.post('app.bsky.notification.putPreferencesV2', { input: appUpdate }))
					: undefined,
				hasUpdates(chatUpdate) && chat
					? ok(chat.post('chat.bsky.notification.putPreferences', { input: chatUpdate }))
					: undefined,
			]);
		},
		onMutate: (update) => {
			optimisticUpdateNotificationSettings(queryClient, update);
		},
		onError: (e) => {
			console.error('Could not update notification settings', e);
			void queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_APP_RQKEY });
			void queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_CHAT_RQKEY });
			Toast.show(m['state.notifications.error.settingsUpdate'](), {
				type: 'error',
			});
		},
	});
}

function optimisticUpdateNotificationSettings(queryClient: QueryClient, update: NotificationSettingsUpdate) {
	const { appUpdate, chatUpdate } = splitNotificationSettingsUpdate(update);

	if (hasUpdates(appUpdate)) {
		queryClient.setQueryData(NOTIFICATION_SETTINGS_APP_RQKEY, (old?: AppNotificationSettingsPreferences) => {
			if (!old) {
				return old;
			}
			return { ...old, ...appUpdate };
		});
	}

	if (hasUpdates(chatUpdate)) {
		queryClient.setQueryData(
			NOTIFICATION_SETTINGS_CHAT_RQKEY,
			(old?: ChatNotificationSettingsPreferences) => {
				if (!old) {
					return old;
				}
				return { ...old, ...chatUpdate };
			},
		);
	}
}

function splitNotificationSettingsUpdate(update: NotificationSettingsUpdate): {
	appUpdate: AppNotificationSettingsUpdate;
	chatUpdate: ChatNotificationSettingsUpdate;
} {
	const { chat, chatRequest, $type: _type, ...appUpdate } = update;

	return {
		appUpdate,
		chatUpdate: {
			...(chat !== undefined ? { chat } : {}),
			...(chatRequest !== undefined ? { chatRequest } : {}),
		},
	};
}

function hasUpdates(update: object) {
	return Object.keys(update).length > 0;
}
