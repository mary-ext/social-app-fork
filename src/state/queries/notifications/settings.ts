import type { AppBskyNotificationDefs, ChatBskyNotificationDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

const RQKEY_ROOT = 'notification-settings';
const RQKEY_APP = [RQKEY_ROOT, 'app'];
const RQKEY_CHAT = [RQKEY_ROOT, 'chat'];

// App notification preferences live on the appview. Chat preferences live on a separate chat service proxy
// that can be up or down independently, so they are fetched and cached separately. This combined type names
// every preference for the generic settings dialog, but it is never the shape of a query response.
export type NotificationSettingsPreferences = Omit<AppBskyNotificationDefs.Preferences, 'chat'> &
	Partial<Pick<ChatBskyNotificationDefs.Preferences, 'chat' | 'chatRequest'>>;

export type AppNotificationSettingsPreferences = Omit<AppBskyNotificationDefs.Preferences, 'chat'>;

export type ChatNotificationSettingsPreferences = Pick<
	ChatBskyNotificationDefs.Preferences,
	'chat' | 'chatRequest'
>;

export type NotificationSettingsPreferenceName = Exclude<keyof NotificationSettingsPreferences, '$type'>;

export type NotificationSettingsPreference =
	| AppBskyNotificationDefs.FilterablePreference
	| AppBskyNotificationDefs.Preference
	| ChatBskyNotificationDefs.ChatPreference;

/**
 * Whether the given preference name is one served by the chat service (rather than the appview).
 *
 * @param name the preference name
 * @returns true for `chat`/`chatRequest`
 */
export function isChatPreferenceName(
	name: NotificationSettingsPreferenceName,
): name is 'chat' | 'chatRequest' {
	return name === 'chat' || name === 'chatRequest';
}

type NotificationSettingsUpdate = Partial<NotificationSettingsPreferences>;
type AppNotificationSettingsUpdate = Partial<Omit<AppBskyNotificationDefs.Preferences, '$type' | 'chat'>>;
type ChatNotificationSettingsUpdate = Partial<ChatNotificationSettingsPreferences>;

export function useNotificationSettingsQuery({ enabled }: { enabled?: boolean } = {}) {
	const { appview } = useClients();

	return useQuery({
		queryKey: RQKEY_APP,
		queryFn: async (): Promise<AppNotificationSettingsPreferences> => {
			const data = await ok(appview.get('app.bsky.notification.getPreferences', { params: {} }));
			return appPreferencesWithoutChat(data.preferences);
		},
		enabled,
	});
}

export function useChatNotificationSettingsQuery({ enabled }: { enabled?: boolean } = {}) {
	const { chat } = useClients();

	return useQuery({
		queryKey: RQKEY_CHAT,
		queryFn: async (): Promise<ChatNotificationSettingsPreferences> => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(chat.get('chat.bsky.notification.getPreferences', { params: {} }));
			return chatPreferencesForSettings(data.preferences);
		},
		enabled,
	});
}

export function useNotificationSettingsUpdateMutation() {
	const { appview, chat } = useClients();
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
			logger.error('Could not update notification settings', { message: e });
			void queryClient.invalidateQueries({ queryKey: RQKEY_APP });
			void queryClient.invalidateQueries({ queryKey: RQKEY_CHAT });
			Toast.show(m['state.notifications.error.settingsUpdate'](), {
				type: 'error',
			});
		},
	});
}

function optimisticUpdateNotificationSettings(queryClient: QueryClient, update: NotificationSettingsUpdate) {
	const { appUpdate, chatUpdate } = splitNotificationSettingsUpdate(update);

	if (hasUpdates(appUpdate)) {
		queryClient.setQueryData(RQKEY_APP, (old?: AppNotificationSettingsPreferences) => {
			if (!old) return old;
			return { ...old, ...appUpdate };
		});
	}

	if (hasUpdates(chatUpdate)) {
		queryClient.setQueryData(RQKEY_CHAT, (old?: ChatNotificationSettingsPreferences) => {
			if (!old) return old;
			return { ...old, ...chatUpdate };
		});
	}
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
