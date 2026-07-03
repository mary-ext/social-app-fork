import { useCallback } from 'react';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

export function LegacyNotificationSettingsScreen() {
	const navigation = useNavigation<NavigationProp>();

	useFocusEffect(
		useCallback(() => {
			navigation.replace('NotificationSettings');
		}, [navigation]),
	);

	return null;
}
