import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { chunked } from '@mary-ext/array-fns';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getStarterPackRecord } from '#/lib/api/record-casts';
import { putRecord } from '#/lib/api/records';
import { parseStarterPackUri } from '#/lib/starter-pack';

import { invalidateListMembersQuery } from '#/state/queries/list/cache';
import { invalidateActorStarterPacksQuery, invalidateStarterPack } from '#/state/queries/starter-pack/cache';
import type { UseCreateStarterPackMutationParams } from '#/state/queries/starter-pack/create';
import { resolveDescription } from '#/state/queries/starter-pack/lib/resolve-description';
import { whenAppViewReady } from '#/state/queries/starter-pack/lib/when-app-view-ready';
import { getClients, useSession } from '#/state/session';

export function useEditStarterPackMutation({
	onSuccess,
	onError,
}: {
	onSuccess: () => void;
	onError: (error: Error) => void;
}) {
	const queryClient = useQueryClient();
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();

	return useMutation<
		void,
		Error,
		UseCreateStarterPackMutationParams & {
			currentStarterPack: AppBskyGraphDefs.StarterPackView;
			currentListItems: AppBskyGraphDefs.ListItemView[];
		}
	>({
		mutationFn: async ({ name, description, feeds, profiles, currentStarterPack, currentListItems }) => {
			const did = currentAccount!.did;
			const { description: trimmedDescription, descriptionFacets } = await resolveDescription(
				appview,
				description,
			);

			const spRecord = getStarterPackRecord(currentStarterPack);
			if (spRecord.$type !== 'app.bsky.graph.starterpack') {
				throw new Error('Invalid starter pack');
			}

			const removedItems = currentListItems.filter(
				(i) =>
					i.subject.did !== currentAccount?.did && !profiles.find((p) => p.did === i.subject.did && p.did),
			);
			if (removedItems.length !== 0) {
				const chunks = chunked(removedItems, 50);
				for (const batch of chunks) {
					await ok(
						pds!.post('com.atproto.repo.applyWrites', {
							input: {
								repo: did,
								writes: batch.map((i) => ({
									$type: 'com.atproto.repo.applyWrites#delete',
									collection: 'app.bsky.graph.listitem',
									rkey: parseCanonicalResourceUri(i.uri).rkey,
								})),
							},
						}),
					);
				}
			}

			const addedProfiles = profiles.filter((p) => !currentListItems.find((i) => i.subject.did === p.did));
			if (addedProfiles.length > 0) {
				const chunks = chunked(addedProfiles, 50);
				for (const batch of chunks) {
					await ok(
						pds!.post('com.atproto.repo.applyWrites', {
							input: {
								repo: did,
								writes: batch.map((p) => ({
									$type: 'com.atproto.repo.applyWrites#create',
									collection: 'app.bsky.graph.listitem',
									value: {
										$type: 'app.bsky.graph.listitem',
										createdAt: new Date().toISOString(),
										list: currentStarterPack.list!.uri,
										subject: p.did,
									},
								})),
							},
						}),
					);
				}
			}

			const rkey = parseStarterPackUri(currentStarterPack.uri)!.rkey;
			await putRecord(pds!, {
				repo: did,
				rkey,
				record: {
					$type: 'app.bsky.graph.starterpack',
					createdAt: spRecord.createdAt,
					description: trimmedDescription,
					descriptionFacets,
					feeds: feeds?.map((f) => ({ uri: f.uri })),
					list: currentStarterPack.list!.uri,
					name,
				},
			});
		},
		onSuccess: async (_, { currentStarterPack }) => {
			const parsed = parseStarterPackUri(currentStarterPack.uri);
			await whenAppViewReady(appview, currentStarterPack.uri, (v) => {
				return !!v && currentStarterPack.cid !== v.starterPack.cid;
			});
			await invalidateActorStarterPacksQuery({
				queryClient,
				did: currentAccount!.did,
			});
			if (currentStarterPack.list) {
				// the full member list takes several requests to refetch, so don't hold up the save on it
				void invalidateListMembersQuery({
					queryClient,
					uri: currentStarterPack.list.uri,
				});
			}
			await invalidateStarterPack({
				queryClient,
				did: currentAccount!.did,
				rkey: parsed!.rkey,
			});
			onSuccess();
		},
		onError: (error) => {
			onError(error);
		},
	});
}
