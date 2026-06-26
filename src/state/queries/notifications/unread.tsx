/** A kind of companion API to ./feed.ts. See that file for more info. */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ok } from '@atcute/client';
import { useQueryClient } from '@tanstack/react-query';

import BroadcastChannel from '#/lib/broadcast';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useClients, useSession } from '#/state/session';

import { RQKEY as RQKEY_NOTIFS } from './feed';
import type { CachedFeedPage, FeedPage } from './types';
import { fetchPage } from './util';

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

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const { hasSession } = useSession();
	const { appview } = useClients();
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
		const listener = ({ data }: MessageEvent) => {
			const event = (data as { event: string }).event;
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
	const api = useMemo<ApiContext>(() => {
		return {
			async markAllRead() {
				// update server
				await ok(
					appview.post('app.bsky.notification.updateSeen', {
						input: { seenAt: cacheRef.current.syncedAt.toISOString() },
						as: null,
					}),
				);

				// update & broadcast
				setNumUnread('');
				broadcast.postMessage({ event: '' });
			},

			async checkUnread({ invalidate, isPoll }: { invalidate?: boolean; isPoll?: boolean } = {}) {
				// single-flight guard: only the call that acquires the lock clears it, so an early-returning
				// call (e.g. a re-fire triggered by an api-identity change while a fetch is in flight) can't
				// release another request's lock.
				let acquired = false;
				try {
					if (!hasSession) return;
					if (AppState.currentState !== 'active') {
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
					isFetchingRef.current = true;
					acquired = true;

					// count
					const { page, indexedAt: lastIndexed } = await fetchPage({
						appview,
						cursor: undefined,
						limit: 40,
						queryClient,
						moderationOpts,
						reasons: [],

						// only fetch subjects when the page is going to be used
						// in the notifications query, otherwise skip it
						fetchAdditionalData: !!invalidate,
					});
					const unreadCount = countUnread(page);
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
						void truncateAndInvalidate(queryClient, RQKEY_NOTIFS('all'));
						void truncateAndInvalidate(queryClient, RQKEY_NOTIFS('mentions'));
					}
					broadcast.postMessage({ event: unreadCountStr });
				} finally {
					if (acquired) {
						isFetchingRef.current = false;
					}
				}
			},

			getCachedUnreadPage() {
				// return cached page if it's marked as fresh enough
				if (cacheRef.current.usableInFeed) {
					return cacheRef.current.data;
				}
			},
		};
	}, [setNumUnread, queryClient, moderationOpts, appview, hasSession]);

	// periodic sync. depends on api (not a ref bridge) so a fresh mount with hasSession has the callback in
	// hand when this effect first runs — effect order is no longer load-bearing.
	useEffect(() => {
		if (!hasSession) {
			return;
		}
		void api.checkUnread(); // fire on init
		const interval = setInterval(() => void api.checkUnread({ isPoll: true }), UPDATE_INTERVAL);
		return () => clearInterval(interval);
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
