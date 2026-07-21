import type { NotificationSettingsPreference } from '#/state/queries/notifications/settings';

import { m } from '#/paraglide/messages';

/**
 * A short summary of a notification preference (channels + audience), shown as the subtitle of a settings
 * row.
 *
 * @param preference the notification preference, or undefined while loading
 * @returns a localized summary string, or null when there's no preference
 */
export function SettingPreview({ preference }: { preference?: NotificationSettingsPreference }) {
	if (!preference) {
		return null;
	}

	if ('include' in preference) {
		// Chat preferences carry no in-app (`list`) channel, so guard before reading it.
		const list = 'list' in preference && preference.list;
		if (preference.include === 'all') {
			if (list && preference.push) {
				return m['screens.settings.notifications.channel.inAppPushEveryone']();
			}
			if (list) {
				return m['screens.settings.notifications.channel.inAppEveryone']();
			}
			if (preference.push) {
				return m['screens.settings.notifications.channel.pushEveryone']();
			}
		} else if (preference.include === 'follows') {
			if (list && preference.push) {
				return m['screens.settings.notifications.channel.inAppPushFollowing']();
			}
			if (list) {
				return m['screens.settings.notifications.channel.inAppFollowing']();
			}
			if (preference.push) {
				return m['screens.settings.notifications.channel.pushFollowing']();
			}
		}
	} else {
		const list = 'list' in preference && preference.list;
		if (list && preference.push) {
			return m['screens.settings.notifications.channel.inAppPush']();
		}
		if (list) {
			return m['screens.settings.notifications.channel.inApp']();
		}
		if (preference.push) {
			return m['screens.settings.notifications.channel.push']();
		}
	}

	return m['common.status.off']();
}
