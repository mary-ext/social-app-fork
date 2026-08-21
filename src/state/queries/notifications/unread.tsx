/** A kind of companion API to ./feed.ts. See that file for more info. */

import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import type { AppBskyNotificationListNotifications } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';
import { type Client, ok } from '@atcute/client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';

import { isDocumentVisible } from '#/lib/browser/visibility';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { truncateAndInvalidate } from '#/state/queries/util';
import { getClients, useSession } from '#/state/session';

import { notificationFeedQueryKey } from './notification-feed-key';
import { shouldFilterNotification } from './notification-filter';
import type { CachedFeedPage, FeedPage } from './types';

const UPDATE_INTERVAL = 30 * 1e3; // 30sec

const broadcast = new BroadcastChannel('NOTIFS_BROADCAST_CHANNEL');

type StateContext = string;

interface ApiContext {
	markAllRead: () => Promise<void>;
	checkUnread: (opts?: { invalidate?: boolean; isPoll?: boolean }) => Promise<void>;
	getCachedUnreadPage: () => FeedPage | undefined;
}

const stateContext = createContext<StateContext>('');
stateContext.displayName = 'NotificationsUnreadStateContext';

const apiContext = createContext<ApiContext>({
	async markAllRead() {},
	async checkUnread() {},
	getCachedUnreadPage: () => undefined,
});
apiContext.displayName = 'NotificationsUnreadApiContext';

export function Provider({ children }: PropsWithChildren<{}>) {
	const { hasSession } = useSession();
	const { appview } = getClients();
	const queryClient = useQueryClient();
	const moderationOpts = useModerationOpts();

	const [numUnread, setNumUnread] = useState('');

	const cacheRef = useRef<CachedFeedPage>({
		usableInFeed: false,
		syncedAt: new Date(),
		data: undefined,
		unreadCount: 0,
	});

	// listen for broadcasts
	useEffect(() => {
		const listener = ({ data }: MessageEvent<{ event: string }>) => {
			const { event } = data;
			cacheRef.current = {
				usableInFeed: false,
				syncedAt: new Date(),
				data: undefined,
				unreadCount: event === '30+' ? 30 : event === '' ? 0 : parseInt(event, 10) || 1,
			};
			setNumUnread(event);
		};
		broadcast.addEventListener('message', listener);
		return () => {
			broadcast.removeEventListener('message', listener);
		};
	}, [setNumUnread]);

	const isFetchingRef = useRef(false);

	// create API
	const api: ApiContext = {
		async markAllRead() {
			// update server
			await ok(
				appview.post('app.bsky.notification.updateSeen', {
					as: null,
					input: { seenAt: cacheRef.current.syncedAt.toISOString() },
				}),
			);

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
			if (isPoll && cacheRef.current?.unreadCount !== 0) {
				// if hit 30+ then don't poll, otherwise reduce polling by 50%
				if (cacheRef.current?.unreadCount >= 30 || Math.random() >= 0.5) {
					return;
				}
			}

			if (isFetchingRef.current) {
				return;
			}

			// single-flight guard: taken here past every early return, released on both the success and error
			// paths below so a re-fire can't clear another request's in-flight lock.
			isFetchingRef.current = true;
			try {
				// skip grouping and subject fetches unless the feed cache needs them.
				const { page, lastIndexed, unreadCount } = invalidate
					? await fetchGroupedUnread({ appview, queryClient, moderationOpts })
					: await fetchRawUnread({ appview, moderationOpts });
				const unreadCountStr = unreadCount >= 30 ? '30+' : unreadCount === 0 ? '' : String(unreadCount);

				// track last sync
				const now = new Date();
				const lastIndexedDate = lastIndexed ? new Date(lastIndexed) : undefined;
				cacheRef.current = {
					usableInFeed: !!invalidate, // will be used immediately
					data: page,
					syncedAt: !lastIndexedDate || now > lastIndexedDate ? now : lastIndexedDate,
					unreadCount,
				};

				// update & broadcast
				setNumUnread(unreadCountStr);
				if (invalidate) {
					void truncateAndInvalidate(queryClient, notificationFeedQueryKey('all'));
					void truncateAndInvalidate(queryClient, notificationFeedQueryKey('mentions'));
				}
				// oxlint-disable-next-line unicorn/require-post-message-target-origin -- BroadcastChannel, not a Window
				broadcast.postMessage({ event: unreadCountStr });
			} catch (err) {
				isFetchingRef.current = false;
				throw err;
			}
			isFetchingRef.current = false;
		},

		getCachedUnreadPage() {
			// return cached page if it's marked as fresh enough
			if (cacheRef.current.usableInFeed) {
				return cacheRef.current.data;
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

function countUnread(page: FeedPage) {
	let num = 0;
	for (const item of page.items) {
		if (!item.notification.isRead) {
			num++;
		}
		if (item.additional) {
			for (const item2 of item.additional) {
				if (!item2.isRead) {
					num++;
				}
			}
		}
	}
	return num;
}

function countRawUnread(
	notifications: AppBskyNotificationListNotifications.Notification[],
	moderationOpts: ModerationOptions | undefined,
) {
	let count = 0;
	for (const notification of notifications) {
		if (!notification.isRead && !shouldFilterNotification(notification, moderationOpts)) {
			count++;
		}
	}
	return count;
}

type UnreadCheck = { page: FeedPage | undefined; lastIndexed: string | undefined; unreadCount: number };

const unreadCheckParams = () => ({ limit: 40, reasons: [] as string[] });

const fetchGroupedUnread = async ({
	appview,
	queryClient,
	moderationOpts,
}: {
	appview: Client;
	queryClient: QueryClient;
	moderationOpts: ModerationOptions | undefined;
}): Promise<UnreadCheck> => {
	const { fetchPage } = await import('./util');
	const { page, indexedAt } = await fetchPage({
		appview,
		cursor: undefined,
		queryClient,
		moderationOpts,
		fetchAdditionalData: true,
		...unreadCheckParams(),
	});
	return { page, lastIndexed: indexedAt, unreadCount: countUnread(page) };
};

// grouping preserves every notification in `additional`, so raw and grouped counts match.
const fetchRawUnread = async ({
	appview,
	moderationOpts,
}: {
	appview: Client;
	moderationOpts: ModerationOptions | undefined;
}): Promise<UnreadCheck> => {
	const data = await ok(
		appview.get('app.bsky.notification.listNotifications', { params: unreadCheckParams() }),
	);
	return {
		page: undefined,
		lastIndexed: data.notifications[0]?.indexedAt,
		unreadCount: countRawUnread(data.notifications, moderationOpts),
	};
};
