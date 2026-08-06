import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MAX_LABELERS } from '#/lib/constants/profile';

import { GCTIME, STALE } from '#/state/queries';
import { preferencesQueryKey, usePreferencesQuery } from '#/state/queries/preferences';
import { addLabeler, removeLabeler } from '#/state/queries/preferences/agent';
import { createQueryKey } from '#/state/queries/util';
import { getClients } from '#/state/session';

const labelerInfoQueryKeyRoot = 'labeler-info';
const labelerInfoQueryKey = (did: string) => [labelerInfoQueryKeyRoot, did];

const createLabelersDetailedInfoQueryKey = (dids: string[]) =>
	createQueryKey('labelers-detailed-info', { dids }, { persistedVersion: 1 });

/**
 * queries the labeler service record published by an account.
 *
 * @param did the account's did; the query idles until it is known
 * @returns a query whose data is the detailed service view, or null if the account publishes no labeler
 *   service
 */
export function useLabelerInfoQuery({ did }: { did?: Did }) {
	const { appview } = getClients();
	return useQuery({
		queryKey: labelerInfoQueryKey(did ?? ''),
		enabled: !!did,
		staleTime: STALE.MINUTES.ONE,
		queryFn: async () => {
			const data = await ok(
				appview.get('app.bsky.labeler.getServices', {
					params: { detailed: true, dids: [did!] },
				}),
			);

			// the appview omits dids that don't publish a service, so an empty result isn't an error
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `detailed: true` makes the service views detailed
			return (data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed | undefined) ?? null;
		},
	});
}

export function useLabelersDetailedInfoQuery({ dids }: { dids: Did[] }) {
	const { appview } = getClients();
	return useQuery({
		queryKey: createLabelersDetailedInfoQueryKey(dids),
		enabled: !!dids.length,
		staleTime: STALE.MINUTES.ONE,
		gcTime: GCTIME.INFINITY,
		queryFn: async () => {
			const data = await ok(
				appview.get('app.bsky.labeler.getServices', {
					params: { detailed: true, dids },
				}),
			);
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `detailed: true` makes the service views detailed
			return data.views as AppBskyLabelerDefs.LabelerViewDetailed[];
		},
	});
}

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
