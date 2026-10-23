import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MAX_LABELERS } from '#/lib/constants/profile';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import { addLabeler, removeLabeler } from '#/state/queries/preferences/lib/labelers';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { getClients } from '#/state/session';

export function useRemoveLabelersMutation() {
	const queryClient = useQueryClient();
	const { pds } = getClients();

	return useMutation({
		async mutationFn({ dids }: { dids: Did[] }) {
			await Promise.all(dids.map((did) => removeLabeler(pds!, did)));
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}

export function useLabelerSubscriptionMutation() {
	const queryClient = useQueryClient();
	const { appview, pds } = getClients();
	const preferences = usePreferencesQuery();

	return useMutation({
		async mutationFn({ did, subscribe }: { did: Did; subscribe: boolean }) {
			/**
			 * filters out invalid, taken down, or deactivated labelers, ensuring the total count does not exceed
			 * {@link MAX_LABELERS}
			 */
			const labelerDids = (preferences.data?.moderationPrefs?.labelers ?? []).map((l) => l.did);
			const invalidLabelers: Did[] = [];
			if (labelerDids.length) {
				const { profiles } = await ok(
					appview.get('app.bsky.actor.getProfiles', {
						params: { actors: labelerDids },
					}),
				);
				for (const labelerDid of labelerDids) {
					const exists = profiles.find((p) => p.did === labelerDid);
					if (exists) {
						// profile came back but it's not a valid labeler
						if (exists.associated && !exists.associated.labeler) {
							invalidLabelers.push(labelerDid);
						}
					} else {
						// no response came back, might be deactivated or takendown
						invalidLabelers.push(labelerDid);
					}
				}
			}
			if (invalidLabelers.length) {
				await Promise.all(invalidLabelers.map((labelerDid) => removeLabeler(pds!, labelerDid)));
			}

			if (subscribe) {
				const labelerCount = labelerDids.length - invalidLabelers.length;
				if (labelerCount >= MAX_LABELERS) {
					throw new Error('MAX_LABELERS');
				}
				await addLabeler(pds!, did);
			} else {
				await removeLabeler(pds!, did);
			}
		},
		async onSuccess() {
			await queryClient.invalidateQueries({
				queryKey: preferencesQueryKey,
			});
		},
	});
}
