import { useCallback } from 'react';

import { useTitle } from '#/lib/hooks/useTitle';

import { m } from '#/paraglide/messages';
import { useFocusEffect, useRouter } from '#/routes';

export function LegacyNotificationSettingsScreen() {
	const router = useRouter();

	useTitle(m['common.notifications.settingsTitle']());

	useFocusEffect(
		useCallback(() => {
			router.replace(router.build('NotificationSettings'));
		}, [router]),
	);

	return null;
}
