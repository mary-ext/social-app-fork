import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';
import { makeRecordUri } from '#/lib/at-uri';
import { until } from '#/lib/utils/until';

import { invalidateListMembersQuery } from '#/state/queries/list/cache';
import { RQKEY } from '#/state/queries/list/keys';
import { getClients, useSession } from '#/state/session';

/** input for a reference list opt-out toggle. */
export interface ReferenceListOptOutVariables {
	/** opt-out record to delete, or undefined to create one. */
	current: ResourceUri | undefined;
}

/**
 * toggles a reference list opt-out with an optimistic cache update and rollback on failure.
 *
 * @param options.fetchView fetches the view from the appview.
 * @param options.getOptOut reads the viewer's opt-out from the view.
 * @param options.listUri the reference list; toggling fails when it's absent.
 * @param options.queryKey the cached view's query key.
 * @param options.setOptOut returns the view with the viewer's opt-out replaced.
 * @returns a mutation taking {@link ReferenceListOptOutVariables}.
 */
export function useReferenceListOptOutMutation<View>({
	fetchView,
	getOptOut,
	listUri,
	queryKey,
	setOptOut,
}: {
	fetchView: () => Promise<View>;
	getOptOut: (view: View) => ResourceUri | undefined;
	listUri: ResourceUri | undefined;
	queryKey: readonly unknown[];
	setOptOut: (view: View, optOut: ResourceUri | undefined) => View;
}) {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const { pds } = getClients();

	const patchOptOut = (optOut: ResourceUri | undefined) => {
		queryClient.setQueryData<View>(queryKey, (old) => old && setOptOut(old, optOut));
	};

	return useMutation<
		{ createdOptOut: ResourceUri | undefined; view: View | undefined },
		Error,
		ReferenceListOptOutVariables,
		{ previous: View | undefined }
	>({
		mutationFn: async ({ current }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			if (!listUri) {
				throw new Error('No list to opt out of');
			}
			const did = currentAccount.did;

			let createdOptOut: ResourceUri | undefined;
			if (current) {
				await deleteRecord(pds!, {
					repo: did,
					collection: 'app.bsky.graph.referencelistoptout',
					rkey: parseCanonicalResourceUri(current).rkey,
				});
			} else {
				const res = await createRecord(pds!, {
					repo: did,
					record: {
						$type: 'app.bsky.graph.referencelistoptout',
						createdAt: new Date().toISOString(),
						subject: listUri,
					},
				});
				createdOptOut = res.uri;
			}

			let view: View | undefined;
			await until(
				5, // 5 tries
				1e3, // 1s delay between tries
				(value) => {
					if (value === undefined || !!getOptOut(value) === !!current) {
						return false;
					}
					view = value;
					return true;
				},
				fetchView,
			);

			return { createdOptOut, view };
		},
		onMutate: async ({ current }) => {
			await queryClient.cancelQueries({ queryKey });
			const previous = queryClient.getQueryData<View>(queryKey);
			patchOptOut(
				current
					? undefined
					: makeRecordUri(currentAccount!.did, 'app.bsky.graph.referencelistoptout', 'pending'),
			);
			return { previous };
		},
		onSuccess: ({ createdOptOut, view }) => {
			if (view) {
				// duplicate opt-outs resolve to the first indexed record, which may differ from the one we wrote.
				queryClient.setQueryData(queryKey, view);
				void invalidateListMembersQuery({ queryClient, uri: listUri! });
				return;
			}

			// defer refetching until the next mount to avoid restoring stale appview state.
			patchOptOut(createdOptOut);
			void queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKey, context.previous);
			}
			void queryClient.invalidateQueries({ queryKey });
		},
	});
}

/**
 * toggles the viewer's reference list opt-out with an optimistic cache update.
 *
 * @param list the reference list.
 * @returns a mutation taking {@link ReferenceListOptOutVariables}.
 */
export function useListOptOutMutation(list: AppBskyGraphDefs.ListView) {
	const { appview } = getClients();

	return useReferenceListOptOutMutation<AppBskyGraphDefs.ListView>({
		fetchView: async () => {
			const data = await ok(appview.get('app.bsky.graph.getList', { params: { limit: 1, list: list.uri } }));
			return data.list;
		},
		getOptOut: (view) => view.viewer?.referenceListOptOut,
		listUri: list.uri,
		queryKey: RQKEY(list.uri),
		setOptOut: (view, optOut) => ({ ...view, viewer: { ...view.viewer, referenceListOptOut: optOut } }),
	});
}
