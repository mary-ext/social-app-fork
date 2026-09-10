import type { AppBskyGraphGetMutes } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary/array-fns';

import { type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accumulate } from '#/lib/utils/accumulate';
import { networkRetry } from '#/lib/utils/retry';
import { limitConcurrency } from '#/lib/utils/task';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { STALE } from '#/state/queries';
import { RQKEY as MUTED_ACCOUNTS_RQKEY } from '#/state/queries/my-muted-accounts';
import { getClients } from '#/state/session';

const RQKEY_ROOT = 'mute-cleanup';
const RQKEY = () => [RQKEY_ROOT];

const MUTES_PAGE_SIZE = 100;
const NETWORK_RETRIES = 3;
/** guard against cursor loops. */
const MAX_PAGES = 1000;
const UNMUTE_CONCURRENCY = 6;

/**
 * scans every muted account, reporting the running count as pages arrive.
 *
 * @param onProgress receives the running count.
 * @returns the scan query.
 */
export function useMutedAccountsScanQuery({ onProgress }: { onProgress: (count: number) => void }) {
	const { appview } = getClients();
	return useQuery<Did[]>({
		queryKey: RQKEY(),
		staleTime: STALE.INFINITY,
		gcTime: 0,
		retry: false,
		async queryFn({ signal }) {
			let count = 0;
			return await accumulate<Did>(async (cursor) => {
				const data = await networkRetry(NETWORK_RETRIES, () =>
					ok(
						appview.get('app.bsky.graph.getMutes', {
							signal,
							params: { cursor, limit: MUTES_PAGE_SIZE },
						}),
					),
				);
				count += data.mutes.length;
				onProgress(count);
				return { cursor: data.cursor, items: data.mutes.map((profile) => profile.did) };
			}, MAX_PAGES);
		},
	});
}

/**
 * unmutes the given accounts, tolerating individual failures.
 *
 * @returns the unmute mutation.
 */
export function useBulkUnmuteMutation() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return useMutation<{ cleared: Did[]; failed: number }, Error, { dids: Did[] }>({
		retry: false,
		async mutationFn({ dids }) {
			const unmute = limitConcurrency(UNMUTE_CONCURRENCY, async (did: Did) => {
				await ok(
					appview.post('app.bsky.graph.unmuteActor', {
						as: null,
						input: { actor: did },
					}),
				);
				return did;
			});

			// an in-flight page could otherwise resolve against pre-patch data and reinstate removed rows.
			await queryClient.cancelQueries({ queryKey: MUTED_ACCOUNTS_RQKEY() });

			const results = await Promise.allSettled(dids.map((did) => unmute(did)));
			const cleared = mapDefined(results, (result) =>
				result.status === 'fulfilled' ? result.value : undefined,
			);
			return { cleared, failed: results.length - cleared.length };
		},
		onSuccess({ cleared }) {
			if (cleared.length === 0) {
				return;
			}

			const clearedDids = new Set(cleared);
			for (const did of cleared) {
				updateProfileShadow(queryClient, did, { muted: false, mutedOnlyReposts: false });
			}
			queryClient.setQueriesData<InfiniteData<AppBskyGraphGetMutes.$output>>(
				{ queryKey: MUTED_ACCOUNTS_RQKEY() },
				(old) =>
					old && {
						...old,
						pages: old.pages.map((page) => ({
							...page,
							mutes: page.mutes.filter((profile) => !clearedDids.has(profile.did)),
						})),
					},
			);
			// keep confirmed unmutes hidden while the appview catches up.
			void queryClient.invalidateQueries({ queryKey: MUTED_ACCOUNTS_RQKEY(), refetchType: 'none' });
		},
	});
}
