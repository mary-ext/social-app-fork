/** a kind of companion API to `#/state/queries/notifications/feed`. see that file for more info. */

import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import { ok } from '@atcute/client';

import { useQueryClient } from '@tanstack/react-query';

import { isDocumentVisible } from '#/lib/browser/visibility';
import { shouldFilterNotification } from '#/lib/notifications/filter';
import { truncateAndInvalidate } from '#/lib/query/truncate-and-invalidate';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { NOTIFICATION_FEED_RQKEY_ROOT } from '#/state/queries/notifications/keys';
import { getClients, useSession } from '#/state/session';

const UPDATE_INTERVAL = 30 * 1e3; // 30sec

const broadcast = new BroadcastChannel('NOTIFS_BROADCAST_CHANNEL');

type StateContext = string;

interface ApiContext {
	/** marks notifications indexed up to `seenAt` as seen on the server. */
	markAllRead: (seenAt: Date) => Promise<void>;
	/** counts unread notifications; with `invalidate`, also reloads the top of every notification feed. */
	checkUnread: (opts?: { invalidate?: boolean; isPoll?: boolean }) => Promise<void>;
}

const stateContext = createContext<StateContext>('');
stateContext.displayName = 'NotificationsUnreadStateContext';

const apiContext = createContext<ApiContext>({
	async markAllRead() {},
	async checkUnread() {},
});
apiContext.displayName = 'NotificationsUnreadApiContext';

// the count travels as its badge text: '' for none, '30+' past the cap
const MAX_UNREAD_COUNT = 30;

const formatUnreadCount = (count: number): string => {
	if (count >= MAX_UNREAD_COUNT) {
		return `${MAX_UNREAD_COUNT}+`;
	}
	if (count === 0) {
		return '';
	}
	return String(count);
};

const parseUnreadCount = (text: string): number => {
	if (text === '') {
		return 0;
	}
	return Math.min(parseInt(text, 10) || 1, MAX_UNREAD_COUNT);
};

export function Provider({ children }: PropsWithChildren<{}>) {
	const { hasSession } = useSession();
	const { appview } = getClients();
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();

	const [numUnread, setNumUnread] = useState('');
	const unreadCountRef = useRef(0);

	// listen for broadcasts
	useEffect(() => {
		const listener = ({ data }: MessageEvent<{ event: string }>) => {
			unreadCountRef.current = parseUnreadCount(data.event);
			setNumUnread(data.event);
		};
		broadcast.addEventListener('message', listener);
		return () => {
			broadcast.removeEventListener('message', listener);
		};
	}, [setNumUnread]);

	const isFetchingRef = useRef(false);
	const lastMarkedReadAt = useRef(0);

	// create API
	const api: ApiContext = {
		async markAllRead(seenAt) {
			// update server
			await ok(
				appview.post('app.bsky.notification.updateSeen', {
					as: null,
					input: { seenAt: seenAt.toISOString() },
				}),
			);
			lastMarkedReadAt.current = Date.now();
			unreadCountRef.current = 0;

			// update & broadcast
			setNumUnread('');
			// oxlint-disable-next-line unicorn/require-post-message-target-origin -- BroadcastChannel, not a Window
			broadcast.postMessage({ event: '' });
		},

		async checkUnread({ invalidate, isPoll }: { invalidate?: boolean; isPoll?: boolean } = {}) {
			if (!hasSession) {
				return;
			}
			if (!isDocumentVisible()) {
				return;
			}

			// reduce polling if unread count is set
			if (isPoll && unreadCountRef.current !== 0) {
				// if hit the cap then don't poll, otherwise reduce polling by 50%
				if (unreadCountRef.current >= MAX_UNREAD_COUNT || Math.random() >= 0.5) {
					return;
				}
			}

			if (invalidate) {
				// counting would be wasted: the feed's own load marks what it shows as read, which clears the count
				await truncateAndInvalidate(queryClient, [NOTIFICATION_FEED_RQKEY_ROOT]);
				return;
			}

			if (isFetchingRef.current) {
				return;
			}

			isFetchingRef.current = true;
			try {
				const requestedAt = Date.now();
				const data = await ok(
					appview.get('app.bsky.notification.listNotifications', { params: { limit: 40 } }),
				);
				// discard counts fetched before markAllRead
				if (requestedAt < lastMarkedReadAt.current) {
					return;
				}

				let unreadCount = 0;
				for (const notification of data.notifications) {
					if (!notification.isRead && !shouldFilterNotification(notification, moderationOpts)) {
						unreadCount++;
					}
				}
				const unreadCountStr = formatUnreadCount(unreadCount);
				if (unreadCountStr === formatUnreadCount(unreadCountRef.current)) {
					return;
				}
				unreadCountRef.current = unreadCount;

				// update & broadcast
				setNumUnread(unreadCountStr);
				// oxlint-disable-next-line unicorn/require-post-message-target-origin -- BroadcastChannel, not a Window
				broadcast.postMessage({ event: unreadCountStr });
			} finally {
				isFetchingRef.current = false;
			}
		},
	};

	// periodic sync. depends on api (not a ref bridge) so a fresh mount with hasSession has the callback in
	// hand when this effect first runs — effect order is no longer load-bearing.
	useEffect(() => {
		if (!hasSession) {
			return;
		}
		void api.checkUnread(); // fire on init
		const interval = setInterval(() => void api.checkUnread({ isPoll: true }), UPDATE_INTERVAL);
		return () => clearInterval(interval);

		// oxlint-disable-next-line react-hooks/exhaustive-deps -- React Compiler stabilizes the API object
	}, [hasSession, api]);

	return (
		<stateContext.Provider value={numUnread}>
			<apiContext.Provider value={api}>{children}</apiContext.Provider>
		</stateContext.Provider>
	);
}

export function useUnreadNotifications() {
	return useContext(stateContext);
}

export function useUnreadNotificationsApi() {
	return useContext(apiContext);
}
