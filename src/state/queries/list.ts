import type { ComAtprotoRepoApplyWrites } from '@atcute/atproto';
import type { AppBskyGraphDefs, AppBskyGraphList, AppBskyRichtextFacet } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import chunk from 'lodash.chunk';

import { createRecord, deleteRecord, getRecord, listRecords, putRecord } from '#/lib/api/records';
import { uploadBlob } from '#/lib/api/upload-blob';
import { until } from '#/lib/async/until';

import type { ImageMeta } from '#/state/gallery';
import { STALE } from '#/state/queries';
import { useClients, useSession } from '#/state/session';

import { FEED_INFO_RQKEY_ROOT } from './feed';
import { invalidate as invalidateMyLists } from './my-lists';
import { RQKEY as PROFILE_LISTS_RQKEY } from './profile-lists';

export const RQKEY_ROOT = 'list';
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri];

export function useListQuery(uri?: string) {
	const { appview } = useClients();
	return useQuery<AppBskyGraphDefs.ListView, Error>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY(uri || ''),
		queryFn: async () => {
			if (!uri) {
				throw new Error('URI not provided');
			}
			const data = await ok(
				appview.get('app.bsky.graph.getList', {
					params: { limit: 1, list: uri as ResourceUri },
				}),
			);
			return data.list;
		},
		enabled: !!uri,
	});
}

export interface ListCreateMutateParams {
	purpose: string;
	name: string;
	description: string;
	descriptionFacets: AppBskyRichtextFacet.Main[] | undefined;
	avatar: ImageMeta | null | undefined;
}
export function useListCreateMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: string; cid: string }, Error, ListCreateMutateParams>({
		async mutationFn({ purpose, name, description, descriptionFacets, avatar }) {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			if (purpose !== 'app.bsky.graph.defs#curatelist' && purpose !== 'app.bsky.graph.defs#modlist') {
				throw new Error('Invalid list purpose: must be curatelist or modlist');
			}
			const record: AppBskyGraphList.Main = {
				$type: 'app.bsky.graph.list',
				avatar: undefined,
				createdAt: new Date().toISOString(),
				description,
				descriptionFacets,
				name,
				purpose,
			};
			if (avatar) {
				record.avatar = await uploadBlob(pds!, avatar.blob);
			}
			const res = await createRecord(pds!, {
				collection: 'app.bsky.graph.list',
				record,
				repo: currentAccount.did as Did,
			});

			// wait for the appview to update
			await whenAppViewReady(appview, res.uri, (v) => {
				return typeof v?.uri === 'string';
			});
			return res;
		},
		onSuccess() {
			invalidateMyLists(queryClient);
			queryClient.invalidateQueries({
				queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
			});
		},
	});
}

export interface ListMetadataMutateParams {
	uri: string;
	name: string;
	description: string;
	descriptionFacets: AppBskyRichtextFacet.Main[] | undefined;
	avatar: ImageMeta | null | undefined;
}
export function useListMetadataMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: string; cid: string }, Error, ListMetadataMutateParams>({
		async mutationFn({ uri, name, description, descriptionFacets, avatar }) {
			const { repo, rkey } = parseCanonicalResourceUri(uri);
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			if (currentAccount.did !== repo) {
				throw new Error('You do not own this list');
			}

			// get the current record
			const { value: record } = await getRecord(pds!, {
				collection: 'app.bsky.graph.list',
				repo: currentAccount.did as Did,
				rkey,
			});

			// update the fields
			record.name = name;
			record.description = description;
			record.descriptionFacets = descriptionFacets;
			if (avatar) {
				record.avatar = await uploadBlob(pds!, avatar.blob);
			} else if (avatar === null) {
				record.avatar = undefined;
			}
			const res = await putRecord(pds!, {
				collection: 'app.bsky.graph.list',
				record,
				repo: currentAccount.did as Did,
				rkey,
			});

			// wait for the appview to update
			await whenAppViewReady(appview, res.uri, (v) => {
				return v?.name === record.name && v?.description === record.description;
			});
			return res;
		},
		onSuccess(_data, variables) {
			invalidateMyLists(queryClient);
			queryClient.invalidateQueries({
				queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
			});
			queryClient.invalidateQueries({
				queryKey: RQKEY(variables.uri),
			});
			queryClient.invalidateQueries({
				queryKey: [FEED_INFO_RQKEY_ROOT],
			});
		},
	});
}

export function useListDeleteMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { uri: string }>({
		mutationFn: async ({ uri }) => {
			if (!currentAccount) {
				return;
			}
			// fetch all the listitem records that belong to this list
			let cursor: string | undefined;
			let listitemRecordUris: string[] = [];
			for (let i = 0; i < 100; i++) {
				const res = await listRecords(pds!, {
					collection: 'app.bsky.graph.listitem',
					cursor,
					limit: 100,
					repo: currentAccount.did as Did,
				});
				listitemRecordUris = listitemRecordUris.concat(
					res.records.filter((record) => record.value.list === uri).map((record) => record.uri),
				);
				cursor = res.cursor;
				if (!cursor) {
					break;
				}
			}

			// batch delete the list and listitem records
			const createDel = (uri: string): ComAtprotoRepoApplyWrites.$input['writes'][number] => {
				const urip = parseCanonicalResourceUri(uri);
				return {
					$type: 'com.atproto.repo.applyWrites#delete',
					collection: urip.collection,
					rkey: urip.rkey,
				};
			};
			const writes = listitemRecordUris.map((uri) => createDel(uri)).concat([createDel(uri)]);

			// apply in chunks
			for (const writesChunk of chunk(writes, 10)) {
				await ok(
					pds!.post('com.atproto.repo.applyWrites', {
						input: {
							repo: currentAccount.did as Did,
							writes: writesChunk,
						},
					}),
				);
			}

			// wait for the appview to update (the list read fails once it's gone)
			await whenAppViewReady(appview, uri, (v) => {
				return !v;
			});
		},
		onSuccess() {
			invalidateMyLists(queryClient);
			queryClient.invalidateQueries({
				queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
			});
			// TODO!! /* dont await */ this.rootStore.preferences.removeSavedFeed(this.uri)
		},
	});
}

export function useListMuteMutation() {
	const queryClient = useQueryClient();
	const { appview } = useClients();
	return useMutation<void, Error, { uri: string; mute: boolean }>({
		mutationFn: async ({ uri, mute }) => {
			await ok(
				appview.post(mute ? 'app.bsky.graph.muteActorList' : 'app.bsky.graph.unmuteActorList', {
					as: null,
					input: { list: uri as ResourceUri },
				}),
			);

			await whenAppViewReady(appview, uri, (v) => {
				return Boolean(v?.viewer?.muted) === mute;
			});
		},
		onSuccess(_data, variables) {
			queryClient.invalidateQueries({
				queryKey: RQKEY(variables.uri),
			});
		},
	});
}

export function useListBlockMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { uri: string; block: boolean }>({
		mutationFn: async ({ uri, block }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			if (block) {
				await createRecord(pds!, {
					collection: 'app.bsky.graph.listblock',
					record: {
						$type: 'app.bsky.graph.listblock',
						createdAt: new Date().toISOString(),
						subject: uri as ResourceUri,
					},
					repo: currentAccount.did as Did,
				});
			} else {
				const data = await ok(
					appview.get('app.bsky.graph.getList', {
						params: { limit: 1, list: uri as ResourceUri },
					}),
				);
				const blocked = data.list.viewer?.blocked;
				if (blocked) {
					await deleteRecord(pds!, {
						collection: 'app.bsky.graph.listblock',
						repo: currentAccount.did as Did,
						rkey: parseCanonicalResourceUri(blocked).rkey,
					});
				}
			}

			await whenAppViewReady(appview, uri, (v) => {
				return block ? typeof v?.viewer?.blocked === 'string' : !v?.viewer?.blocked;
			});
		},
		onSuccess(_data, variables) {
			queryClient.invalidateQueries({
				queryKey: RQKEY(variables.uri),
			});
		},
	});
}

async function whenAppViewReady(
	appview: Client,
	uri: string,
	fn: (v: AppBskyGraphDefs.ListView | undefined) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		async () => {
			const data = await ok(
				appview.get('app.bsky.graph.getList', {
					params: { limit: 1, list: uri as ResourceUri },
				}),
			);
			return data.list;
		},
	);
}
