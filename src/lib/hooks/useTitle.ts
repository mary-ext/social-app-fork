import { useCallback } from 'react';

import { useFocusEffect } from '#/lib/router';
import { bskyTitle } from '#/lib/strings/headings';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';

/** sets the document title (with unread count) while this route is focused. every screen should call it. */
export function useTitle(title: string) {
	const numUnread = useUnreadNotifications();

	useFocusEffect(
		useCallback(() => {
			document.title = bskyTitle(title, numUnread);
		}, [numUnread, title]),
	);
}
