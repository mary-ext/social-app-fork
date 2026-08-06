import { useFocusEffect } from '@oomfware/stacker';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';

function documentTitle(page: string, unreadCountLabel?: string) {
	const unreadPrefix = unreadCountLabel ? `(${unreadCountLabel}) ` : '';
	return `${unreadPrefix}${page} — Bluesky`;
}

/** sets the document title (with unread count) while this route is focused. every screen should call it. */
export function useTitle(title: string) {
	const numUnread = useUnreadNotifications();

	useFocusEffect(() => {
		document.title = documentTitle(title, numUnread);
	});
}
