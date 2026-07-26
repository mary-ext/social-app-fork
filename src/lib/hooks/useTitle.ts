import { useFocusEffect } from '@oomfware/stacker';

import { bskyTitle } from '#/lib/strings/headings';

import { useUnreadNotifications } from '#/state/queries/notifications/unread';

/** sets the document title (with unread count) while this route is focused. every screen should call it. */
export function useTitle(title: string) {
	const numUnread = useUnreadNotifications();

	useFocusEffect(() => {
		document.title = bskyTitle(title, numUnread);
	});
}
