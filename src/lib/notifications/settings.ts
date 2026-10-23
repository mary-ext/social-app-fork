import type { AppBskyNotificationDefs, ChatBskyNotificationDefs } from '@atcute/bluesky';

// app and chat preferences use separate services, so they are fetched and cached independently.
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
 * whether a preference name is served by the chat service rather than the appview.
 *
 * @param name the preference name
 * @returns true for `chat`/`chatRequest`
 */
export function isChatPreferenceName(
	name: NotificationSettingsPreferenceName,
): name is 'chat' | 'chatRequest' {
	return name === 'chat' || name === 'chatRequest';
}
