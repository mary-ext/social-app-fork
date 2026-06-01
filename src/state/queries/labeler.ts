import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MAX_LABELERS } from '#/lib/constants';

import { GCTIME, STALE } from '#/state/queries';
import { preferencesQueryKey, usePreferencesQuery } from '#/state/queries/preferences';
import { addLabeler, removeLabeler } from '#/state/queries/preferences/agent';
import { createQueryKey } from '#/state/queries/util';
import { useClients } from '#/state/session';

const labelerInfoQueryKeyRoot = 'labeler-info';
export const labelerInfoQueryKey = (did: string) => [labelerInfoQueryKeyRoot, did];

const labelersInfoQueryKeyRoot = 'labelers-info';
export const labelersInfoQueryKey = (dids: string[]) => [labelersInfoQueryKeyRoot, dids.slice().sort()];

const createLabelersDetailedInfoQueryKey = (dids: string[]) =>
	createQueryKey('labelers-detailed-info', { dids }, { persistedVersion: 1 });

export function useLabelerInfoQuery({ did, enabled }: { did?: string; enabled?: boolean }) {
	const { appview } = useClients();
	return useQuery({
		enabled: !!did && enabled !== false,
		queryKey: labelerInfoQueryKey(did as string),
		queryFn: async () => {
			const data = await ok(
				appview.get('app.bsky.labeler.getServices', {
					params: { detailed: true, dids: [did! as Did] },
				}),
			);
			return data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed;
		},
	});
}

export function useLabelersInfoQuery({ dids }: { dids: string[] }) {
	const { appview } = useClients();
	return useQuery({
		enabled: !!dids.length,
		queryKey: labelersInfoQueryKey(dids),
		queryFn: async () => {
			const data = await ok(
				appview.get('app.bsky.labeler.getServices', {
					params: { dids: dids as Did[] },
				}),
			);
			return data.views as AppBskyLabelerDefs.LabelerView[];
		},
	});
}

export function useLabelersDetailedInfoQuery({ dids }: { dids: string[] }) {
	const { appview } = useClients();
	return useQuery({
		enabled: !!dids.length,
		queryKey: createLabelersDetailedInfoQueryKey(dids),
		gcTime: GCTIME.INFINITY,
		staleTime: STALE.MINUTES.ONE,
		queryFn: async () => {
			const data = await ok(
				appview.get('app.bsky.labeler.getServices', {
					params: { detailed: true, dids: dids as Did[] },
				}),
			);
			return data.views as AppBskyLabelerDefs.LabelerViewDetailed[];
		},
	});
}

export function useRemoveLabelersMutation() {
	const queryClient = useQueryClient();
	const { pds } = useClients();

	return useMutation({
		async mutationFn({ dids }: { dids: string[] }) {
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
	const { appview, pds } = useClients();
	const preferences = usePreferencesQuery();

	return useMutation({
		async mutationFn({ did, subscribe }: { did: string; subscribe: boolean }) {
			/**
			 * If a user has invalid/takendown/deactivated labelers, we need to remove them. We don't have a great
			 * way to do this atm on the server, so we do it here.
			 *
			 * We also need to push validation into this method, since we need to check {@link MAX_LABELERS} _after_
			 * we've removed invalid or takendown labelers.
			 */
			const labelerDids = (preferences.data?.moderationPrefs?.labelers ?? []).map((l) => l.did);
			const invalidLabelers: string[] = [];
			if (labelerDids.length) {
				const { profiles } = await ok(
					appview.get('app.bsky.actor.getProfiles', {
						params: { actors: labelerDids as ActorIdentifier[] },
					}),
				);
				for (const did of labelerDids) {
					const exists = profiles.find((p) => p.did === did);
					if (exists) {
						// profile came back but it's not a valid labeler
						if (exists.associated && !exists.associated.labeler) {
							invalidLabelers.push(did);
						}
					} else {
						// no response came back, might be deactivated or takendown
						invalidLabelers.push(did);
					}
				}
			}
			if (invalidLabelers.length) {
				await Promise.all(invalidLabelers.map((did) => removeLabeler(pds!, did)));
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
