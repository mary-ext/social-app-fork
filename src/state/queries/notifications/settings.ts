import type { AppBskyNotificationDefs, ChatBskyNotificationDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import type {
	AppNotificationSettingsPreferences,
	ChatNotificationSettingsPreferences,
} from '#/lib/notifications/settings';

import {
	NOTIFICATION_SETTINGS_APP_RQKEY,
	NOTIFICATION_SETTINGS_CHAT_RQKEY,
} from '#/state/queries/notifications/keys';
import { getClients } from '#/state/session';

export function useNotificationSettingsQuery({ enabled }: { enabled?: boolean } = {}) {
	const { appview } = getClients();

	return useQuery({
		queryKey: NOTIFICATION_SETTINGS_APP_RQKEY,
		enabled,
		queryFn: async ({ signal }): Promise<AppNotificationSettingsPreferences> => {
			const data = await ok(appview.get('app.bsky.notification.getPreferences', { signal, params: {} }));
			return appPreferencesWithoutChat(data.preferences);
		},
	});
}

export function useChatNotificationSettingsQuery({ enabled }: { enabled?: boolean } = {}) {
	const { chat } = getClients();

	return useQuery({
		queryKey: NOTIFICATION_SETTINGS_CHAT_RQKEY,
		enabled,
		queryFn: async ({ signal }): Promise<ChatNotificationSettingsPreferences> => {
			if (!chat) {
				throw new Error('Not signed in');
			}
			const data = await ok(chat.get('chat.bsky.notification.getPreferences', { signal, params: {} }));
			return chatPreferencesForSettings(data.preferences);
		},
	});
}

function appPreferencesWithoutChat(
	preferences: AppBskyNotificationDefs.Preferences,
): Omit<AppBskyNotificationDefs.Preferences, 'chat'> {
	const { chat: _ignoredChat, ...appPreferences } = preferences;
	return appPreferences;
}

function chatPreferencesForSettings(
	preferences: ChatBskyNotificationDefs.Preferences,
): Pick<ChatBskyNotificationDefs.Preferences, 'chat' | 'chatRequest'> {
	return {
		chat: preferences.chat,
		chatRequest: preferences.chatRequest,
	};
}
