import type { AppBskyActorContentVisibilityDeclaration } from '@atcute/bluesky';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getRecord, putRecord } from '#/lib/api/records';
import { isRecordNotFoundError } from '#/lib/errors';

import { STALE } from '#/state/queries';
import { getClients, useSession } from '#/state/session';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export const RQKEY_getContentVisibility = ['content-visibility'];

const COLLECTION = 'app.bsky.actor.contentVisibilityDeclaration';

/** @returns the viewer's content-visibility declaration query */
export function useContentVisibilityQuery() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useQuery({
		queryKey: RQKEY_getContentVisibility,
		staleTime: STALE.MINUTES.FIVE,
		queryFn: async ({ signal }) => {
			try {
				return await getRecord(pds!, {
					signal,
					repo: currentAccount!.did,
					collection: COLLECTION,
					rkey: 'self',
				});
			} catch (err) {
				if (isRecordNotFoundError(err)) {
					// no record means the viewer has not opted out.
					return {
						value: {
							$type: COLLECTION,
							hideFromAlgorithmicRecommendations: false,
						} satisfies AppBskyActorContentVisibilityDeclaration.Main,
					};
				} else {
					throw err;
				}
			}
		},
	});
}

/** @returns a mutation that updates algorithmic recommendation visibility */
export function useContentVisibilityMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (hideFromAlgorithmicRecommendations: boolean) => {
			return await putRecord(pds!, {
				repo: currentAccount!.did,
				collection: COLLECTION,
				rkey: 'self',
				record: {
					$type: COLLECTION,
					hideFromAlgorithmicRecommendations,
				},
			});
		},
		onMutate: (hideFromAlgorithmicRecommendations) => {
			queryClient.setQueryData(
				RQKEY_getContentVisibility,
				(old?: { value: AppBskyActorContentVisibilityDeclaration.Main }) => {
					if (!old) {
						return old;
					}
					return {
						...old,
						value: { ...old.value, hideFromAlgorithmicRecommendations },
					};
				},
			);
		},
		onError: () => {
			Toast.show(m['state.privacy.error.contentVisibilityUpdate']());
			void queryClient.invalidateQueries({ queryKey: RQKEY_getContentVisibility });
		},
	});
}
