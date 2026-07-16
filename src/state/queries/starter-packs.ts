import type {
	AnyProfileView,
	AppBskyFeedDefs,
	AppBskyGraphDefs,
	AppBskyGraphGetStarterPack,
	AppBskyGraphStarterpack,
	AppBskyRichtextFacet,
} from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, Handle, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import chunk from 'lodash.chunk';

import { createRecord, deleteRecord, putRecord } from '#/lib/api/records';
import { until } from '#/lib/async/until';
import { createStarterPackList } from '#/lib/generate-starterpack';
import { detectFacets } from '#/lib/strings/rich-text-facets';
import {
	createStarterPackUri,
	httpStarterPackUriToAtUri,
	parseStarterPackUri,
} from '#/lib/strings/starter-pack';

import { invalidateActorStarterPacksQuery } from '#/state/queries/actor-starter-packs';
import { STALE } from '#/state/queries/index';
import { invalidateListMembersQuery } from '#/state/queries/list-members';
import { useClients, useSession } from '#/state/session';

async function detectDescriptionFacets(
	appview: Client,
	description: string,
): Promise<AppBskyRichtextFacet.Main[] | undefined> {
	const rt = await detectFacets(description, async (handle) => {
		try {
			const res = await ok(
				appview.get('com.atproto.identity.resolveHandle', { params: { handle: handle as Handle } }),
			);
			return res.did;
		} catch {
			return undefined;
		}
	});
	return rt.facets;
}

const RQKEY_ROOT = 'starter-pack';
const RQKEY = ({ uri, did, rkey }: { uri?: string; did?: string; rkey?: string }) => {
	if (uri?.startsWith('https://') || uri?.startsWith('at://')) {
		const parsed = parseStarterPackUri(uri);
		return [RQKEY_ROOT, parsed?.actor, parsed?.rkey];
	} else {
		return [RQKEY_ROOT, did, rkey];
	}
};

export function useStarterPackQuery({ uri, did, rkey }: { uri?: string; did?: string; rkey?: string }) {
	const { appview } = useClients();

	return useQuery<AppBskyGraphDefs.StarterPackView>({
		queryKey: RQKEY(uri ? { uri } : { did, rkey }),
		queryFn: async () => {
			const resolvedUri = !uri
				? `at://${did}/app.bsky.graph.starterpack/${rkey}`
				: uri.startsWith('at://')
					? uri
					: (httpStarterPackUriToAtUri(uri) as string);

			const data = await ok(
				appview.get('app.bsky.graph.getStarterPack', {
					params: { starterPack: resolvedUri as ResourceUri },
				}),
			);
			return data.starterPack;
		},
		enabled: Boolean(uri) || Boolean(did && rkey),
		staleTime: STALE.MINUTES.FIVE,
	});
}

export async function invalidateStarterPack({
	queryClient,
	did,
	rkey,
}: {
	queryClient: QueryClient;
	did: string;
	rkey: string;
}) {
	await queryClient.invalidateQueries({ queryKey: RQKEY({ did, rkey }) });
}

interface UseCreateStarterPackMutationParams {
	name: string;
	description?: string;
	profiles: AnyProfileView[];
	feeds?: AppBskyFeedDefs.GeneratorView[];
}

export function useCreateStarterPackMutation({
	onSuccess,
	onError,
}: {
	onSuccess: (data: { uri: string; cid: string }) => void;
	onError: (e: Error) => void;
}) {
	const queryClient = useQueryClient();
	const { appview, pds } = useClients();
	const { currentAccount } = useSession();

	return useMutation<{ uri: string; cid: string }, Error, UseCreateStarterPackMutationParams>({
		mutationFn: async ({ name, description, feeds, profiles }) => {
			const did = currentAccount!.did as Did;
			let descriptionFacets: AppBskyRichtextFacet.Main[] | undefined;
			if (description) {
				descriptionFacets = await detectDescriptionFacets(appview, description);
			}

			const listRes = await createStarterPackList({
				description,
				descriptionFacets,
				did,
				name,
				pds: pds!,
				profiles,
			});

			return await createRecord(pds!, {
				collection: 'app.bsky.graph.starterpack',
				record: {
					$type: 'app.bsky.graph.starterpack',
					createdAt: new Date().toISOString(),
					description,
					descriptionFacets,
					feeds: feeds?.map((f) => ({ uri: f.uri })),
					list: listRes.uri as ResourceUri,
					name,
				},
				repo: did,
			});
		},
		onSuccess: async (data) => {
			await whenAppViewReady(appview, data.uri, (v) => {
				return typeof v?.starterPack.uri === 'string';
			});
			await invalidateActorStarterPacksQuery({
				queryClient,
				did: currentAccount!.did,
			});
			onSuccess(data);
		},
		onError: (error) => {
			onError(error);
		},
	});
}

export function useEditStarterPackMutation({
	onSuccess,
	onError,
}: {
	onSuccess: () => void;
	onError: (error: Error) => void;
}) {
	const queryClient = useQueryClient();
	const { appview, pds } = useClients();
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
			const did = currentAccount!.did as Did;
			let descriptionFacets: AppBskyRichtextFacet.Main[] | undefined;
			if (description) {
				descriptionFacets = await detectDescriptionFacets(appview, description);
			}

			const spRecord = currentStarterPack.record as AppBskyGraphStarterpack.Main;
			if (spRecord.$type !== 'app.bsky.graph.starterpack') {
				throw new Error('Invalid starter pack');
			}

			const removedItems = currentListItems.filter(
				(i) =>
					i.subject.did !== currentAccount?.did && !profiles.find((p) => p.did === i.subject.did && p.did),
			);
			if (removedItems.length !== 0) {
				const chunks = chunk(removedItems, 50);
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
				const chunks = chunk(addedProfiles, 50);
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
				collection: 'app.bsky.graph.starterpack',
				record: {
					$type: 'app.bsky.graph.starterpack',
					createdAt: spRecord.createdAt,
					description,
					descriptionFacets,
					feeds: feeds?.map((f) => ({ uri: f.uri })),
					list: currentStarterPack.list!.uri,
					name,
				},
				repo: did,
				rkey,
			});
		},
		onSuccess: async (_, { currentStarterPack }) => {
			const parsed = parseStarterPackUri(currentStarterPack.uri);
			await whenAppViewReady(appview, currentStarterPack.uri, (v) => {
				return currentStarterPack.cid !== v?.starterPack.cid;
			});
			await invalidateActorStarterPacksQuery({
				queryClient,
				did: currentAccount!.did,
			});
			if (currentStarterPack.list) {
				await invalidateListMembersQuery({
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

export function useDeleteStarterPackMutation({
	onSuccess,
	onError,
}: {
	onSuccess: () => void;
	onError: (error: Error) => void;
}) {
	const { appview, pds } = useClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ listUri, rkey }: { listUri?: string; rkey: string }) => {
			if (!currentAccount) {
				throw new Error(`Requires signed in user`);
			}

			if (listUri) {
				await deleteRecord(pds!, {
					collection: 'app.bsky.graph.list',
					repo: currentAccount.did as Did,
					rkey: parseCanonicalResourceUri(listUri).rkey,
				});
			}
			await deleteRecord(pds!, {
				collection: 'app.bsky.graph.starterpack',
				repo: currentAccount.did as Did,
				rkey,
			});
		},
		onSuccess: async (_, { listUri, rkey }) => {
			const uri = createStarterPackUri({
				did: currentAccount!.did,
				rkey,
			});

			if (uri) {
				await whenAppViewReady(appview, uri, (v) => {
					return !v?.starterPack;
				});
			}

			if (listUri) {
				await invalidateListMembersQuery({ queryClient, uri: listUri });
			}
			await invalidateActorStarterPacksQuery({
				queryClient,
				did: currentAccount!.did,
			});
			await invalidateStarterPack({
				queryClient,
				did: currentAccount!.did,
				rkey,
			});
			onSuccess();
		},
		onError: (error) => {
			onError(error);
		},
	});
}

async function whenAppViewReady(
	appview: Client,
	uri: string,
	fn: (res?: AppBskyGraphGetStarterPack.$output) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		() => ok(appview.get('app.bsky.graph.getStarterPack', { params: { starterPack: uri as ResourceUri } })),
	);
}

export function precacheStarterPack(
	queryClient: QueryClient,
	starterPack: AppBskyGraphDefs.StarterPackViewBasic | AppBskyGraphDefs.StarterPackView,
) {
	const record = starterPack.record as AppBskyGraphStarterpack.Main;
	if (record.$type !== 'app.bsky.graph.starterpack') {
		return;
	}

	let starterPackView: AppBskyGraphDefs.StarterPackView | undefined;
	if (starterPack.$type === 'app.bsky.graph.defs#starterPackView') {
		starterPackView = starterPack;
	} else if (starterPack.$type === 'app.bsky.graph.defs#starterPackViewBasic') {
		// note: the field claims to be `FeedItem`, but the appview returns un$typed `GeneratorView`
		// objects here -sfn
		const feeds = record.feeds as unknown as AppBskyFeedDefs.GeneratorView[] | undefined;

		const listView: AppBskyGraphDefs.ListViewBasic = {
			// This will be populated once the data from server is fetched
			cid: '',
			name: record.name,
			purpose: 'app.bsky.graph.defs#referencelist',
			uri: record.list,
		};
		starterPackView = {
			...starterPack,
			$type: 'app.bsky.graph.defs#starterPackView',
			feeds,
			list: listView,
		};
	}

	if (starterPackView) {
		queryClient.setQueryData(RQKEY({ uri: starterPack.uri }), starterPackView);
	}
}
