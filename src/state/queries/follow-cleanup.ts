import { useEffect, useRef } from 'react';

import type { AppBskyGraphGetFollows } from '@atcute/bluesky';
import type { Did, ResourceUri } from '@atcute/lexicons';

import { type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bulkDeleteFollows } from '#/lib/bulk-write-follows';
import { type FlaggedFollow, type ScanProgress, scanFollows } from '#/lib/follow-cleanup';
import type { RateLimitBudget } from '#/lib/rate-limit-budget';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { STALE } from '#/state/queries';
import { RQKEY_ROOT as PROFILE_FOLLOWS_RQKEY_ROOT } from '#/state/queries/profile-follows';
import { profileQueryKey } from '#/state/queries/profile-key';
import { getClients, useSession } from '#/state/session';

const RQKEY_ROOT = 'follow-cleanup';

const RQKEY = (did: string) => [RQKEY_ROOT, did];

/**
 * scans the current account's follows on demand.
 *
 * @param budget rate limit budget shared with deletions.
 * @param enabled whether to run the scan.
 * @param onProgress receives scan progress.
 * @returns the scan query.
 */
export function useFollowCleanupScanQuery({
	budget,
	enabled,
	onProgress,
}: {
	budget: RateLimitBudget;
	enabled: boolean;
	onProgress: (progress: ScanProgress) => void;
}) {
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();
	const did = currentAccount?.did;

	return useQuery({
		queryKey: RQKEY(did ?? ''),
		enabled: enabled && !!did && !!pds,
		staleTime: STALE.INFINITY,
		gcTime: 0,
		retry: false,
		async queryFn({ signal }) {
			return await scanFollows({ appview, budget, did: did!, pds: pds! }, { onProgress, signal });
		},
	});
}

/**
 * deletes selected follow records.
 *
 * waits for rate limit capacity. unmounting cancels pending work; completed deletions persist.
 *
 * @param budget rate limit budget shared with the scan.
 * @returns the follow deletion mutation.
 */
export function useBulkUnfollowMutation({ budget }: { budget: RateLimitBudget }) {
	const queryClient = useQueryClient();
	const { pds } = getClients();
	const { currentAccount } = useSession();
	const running = useRef<AbortController>(null);

	useEffect(() => () => running.current?.abort(), []);

	return useMutation<void, Error, { follows: FlaggedFollow[] }>({
		retry: false,
		async mutationFn({ follows }) {
			const did = currentAccount!.did;
			const controller = new AbortController();
			running.current = controller;

			const deleted = new Set<ResourceUri>();
			const cleared = new Set<Did>();
			const followsKey = [PROFILE_FOLLOWS_RQKEY_ROOT, did];
			await queryClient.cancelQueries({ queryKey: followsKey });

			try {
				await bulkDeleteFollows(
					{ budget, did, pds: pds! },
					follows.flatMap((follow) => follow.uris),
					{
						signal: controller.signal,
						onDeleted: (uris) => {
							for (const uri of uris) {
								deleted.add(uri);
							}
							// duplicate follow records may span batches; remove the subject only after all are deleted.
							const removed = new Set<Did>();
							for (const follow of follows) {
								if (!cleared.has(follow.did) && follow.uris.every((uri) => deleted.has(uri))) {
									cleared.add(follow.did);
									removed.add(follow.did);
									// update each subject once to avoid repeated query cache scans.
									updateProfileShadow(queryClient, follow.did, { followingUri: undefined });
								}
							}
							queryClient.setQueryData<FlaggedFollow[]>(RQKEY(did), (old) =>
								old?.flatMap((follow) => {
									const remaining = follow.uris.filter((uri) => !deleted.has(uri));
									return remaining.length ? [{ ...follow, uris: remaining }] : [];
								}),
							);
							queryClient.setQueriesData<InfiniteData<AppBskyGraphGetFollows.$output>>(
								{ queryKey: followsKey },
								(old) =>
									old && {
										...old,
										pages: old.pages.map((page) => ({
											...page,
											follows: page.follows.filter((profile) => !removed.has(profile.did)),
										})),
									},
							);
						},
					},
				);
			} finally {
				running.current = null;
				// keep confirmed removals visible while the appview catches up.
				void queryClient.invalidateQueries({ queryKey: followsKey, refetchType: 'none' });
				void queryClient.invalidateQueries({ queryKey: profileQueryKey(did) });
			}
		},
	});
}
