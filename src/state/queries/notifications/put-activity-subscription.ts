import type { AppBskyNotificationDefs, AppBskyNotificationListActivitySubscriptions } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { RQKEY_getActivitySubscriptions } from '#/state/queries/notifications/keys';
import { getClients } from '#/state/session';

export type ActivitySubscriptionUpdate = Omit<AppBskyNotificationDefs.ActivitySubscription, '$type'>;

/**
 * sets the viewer's activity subscription to an account, updating the profile shadow and dropping the account
 * from the subscription list when fully unsubscribed.
 *
 * @param options.onSuccess called with the saved subscription after caches are updated
 * @returns the mutation
 */
export function usePutActivitySubscriptionMutation({
	onSuccess,
}: {
	onSuccess: (activitySubscription: ActivitySubscriptionUpdate) => void;
}) {
	const { appview } = getClients();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			subject,
			activitySubscription,
		}: {
			subject: Did;
			activitySubscription: ActivitySubscriptionUpdate;
		}) => {
			await ok(
				appview.post('app.bsky.notification.putActivitySubscription', {
					input: {
						subject,
						activitySubscription,
					},
				}),
			);
		},
		onSuccess: (_data, { subject, activitySubscription }) => {
			updateProfileShadow(queryClient, subject, {
				activitySubscription,
			});

			if (!activitySubscription.post && !activitySubscription.reply) {
				// filter out the subscription
				queryClient.setQueryData(
					RQKEY_getActivitySubscriptions,
					(old?: InfiniteData<AppBskyNotificationListActivitySubscriptions.$output>) => {
						if (!old) {
							return old;
						}
						return {
							...old,
							pages: old.pages.map((page) => ({
								...page,
								subscriptions: page.subscriptions.filter((item) => item.did !== subject),
							})),
						};
					},
				);
			}

			onSuccess(activitySubscription);
		},
		onError: (err) => {
			console.error('Could not save activity subscription', err);
		},
	});
}
