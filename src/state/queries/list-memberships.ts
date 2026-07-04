import type {
	AnyProfileView,
	AppBskyActorDefs,
	AppBskyGraphGetListsWithMembership,
	AppBskyGraphGetStarterPacksWithMembership,
} from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import {
	type InfiniteData,
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';
import { accumulate } from '#/lib/async/accumulate';

import { STALE } from '#/state/queries';
import { RQKEY as LIST_MEMBERS_RQKEY } from '#/state/queries/list-members';
import { useClients, useSession } from '#/state/session';

import { RQKEY_WITH_MEMBERSHIP as STARTER_PACKS_WITH_MEMBERSHIPS_RKEY } from './actor-starter-packs';

export type ListWithMembership = AppBskyGraphGetListsWithMembership.ListWithMembership;

const RQKEY_WITH_MEMBERSHIP_ROOT = 'lists-with-membership';
export const RQKEY_WITH_MEMBERSHIP = (actor?: string) => [RQKEY_WITH_MEMBERSHIP_ROOT, actor];

/** fetches the signed-in user's curate and moderation lists, each annotated with the given actor's membership. */
export function listsWithMembershipQueryOptions({
	actor,
	appview,
	enabled = true,
}: {
	actor?: string;
	appview: Client;
	enabled?: boolean;
}) {
	return queryOptions<ListWithMembership[]>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY_WITH_MEMBERSHIP(actor),
		queryFn: () =>
			accumulate((cursor) =>
				ok(
					appview.get('app.bsky.graph.getListsWithMembership', {
						params: { actor: actor! as ActorIdentifier, cursor, limit: 50 },
					}),
				).then((data) => ({ cursor: data.cursor, items: data.listsWithMembership })),
			),
		enabled: Boolean(actor) && enabled,
	});
}

export function useListsWithMembershipQuery(params: { actor?: string; enabled?: boolean }) {
	const { appview } = useClients();
	return useQuery(listsWithMembershipQueryOptions({ ...params, appview }));
}

export function useListMembershipAddMutation({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: { uri: string; cid: string }) => void;
	onError?: (error: Error) => void;
} = {}) {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	// `subject` (the added profile) drives the optimistic membership cache updates in onSuccess below.
	return useMutation<
		{ uri: string; cid: string },
		Error,
		{ actorDid: string; listUri: string; subject?: AnyProfileView }
	>({
		mutationFn: async ({ listUri, actorDid }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			const res = await createRecord(pds!, {
				collection: 'app.bsky.graph.listitem',
				record: {
					$type: 'app.bsky.graph.listitem',
					createdAt: new Date().toISOString(),
					list: listUri as ResourceUri,
					subject: actorDid as Did,
				},
				repo: currentAccount.did as Did,
			});
			// TODO
			// we need to wait for appview to update, but there's not an efficient
			// query for that, so we use a timeout below
			// -prf
			return res;
		},
		onSuccess: (data, variables) => {
			// invalidate the members queries (used for rendering the listings)
			// use a timeout to wait for the appview (see above)
			setTimeout(() => {
				void queryClient.invalidateQueries({
					queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
				});
			}, 1e3);

			// update WITH_MEMBERSHIPS queries

			if (variables.subject) {
				queryClient.setQueryData<ListWithMembership[]>(RQKEY_WITH_MEMBERSHIP(variables.actorDid), (old) =>
					old?.map((item) =>
						item.list.uri === variables.listUri
							? {
									...item,
									listItem: {
										uri: data.uri as ResourceUri,
										subject: variables.subject as AppBskyActorDefs.ProfileView,
									},
								}
							: item,
					),
				);

				type StarterPacksWithMembership = AppBskyGraphGetStarterPacksWithMembership.$output;
				queryClient.setQueryData<InfiniteData<StarterPacksWithMembership>>(
					STARTER_PACKS_WITH_MEMBERSHIPS_RKEY(variables.actorDid),
					(old) => {
						if (!old) return old;

						return {
							...old,
							pages: old.pages.map((page) => ({
								...page,
								starterPacksWithMembership: page.starterPacksWithMembership.map((spWithMembership) => {
									if (
										spWithMembership.starterPack.list &&
										spWithMembership.starterPack.list?.uri === variables.listUri
									) {
										return {
											...spWithMembership,
											starterPack: {
												...spWithMembership.starterPack,
												listItemsSample: [
													{
														uri: data.uri,
														subject: variables.subject as AppBskyActorDefs.ProfileViewBasic,
													},
													...(spWithMembership.starterPack.listItemsSample?.filter(
														(item) => item.subject.did !== variables.actorDid,
													) ?? []),
												],
												list: {
													...spWithMembership.starterPack.list,
													listItemCount: (spWithMembership.starterPack.list.listItemCount ?? 0) + 1,
												},
											},
											listItem: {
												uri: data.uri,
												subject: variables.subject as AppBskyActorDefs.ProfileViewBasic,
											},
										};
									}

									return spWithMembership;
								}),
							})),
						} as InfiniteData<StarterPacksWithMembership>;
					},
				);
			}

			onSuccess?.(data);
		},
		onError,
	});
}

export function useListMembershipRemoveMutation({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: void) => void;
	onError?: (error: Error) => void;
} = {}) {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { listUri: string; actorDid: string; membershipUri: string }>({
		mutationFn: async ({ membershipUri }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			const membershipUrip = parseCanonicalResourceUri(membershipUri);
			await deleteRecord(pds!, {
				collection: 'app.bsky.graph.listitem',
				repo: currentAccount.did as Did,
				rkey: membershipUrip.rkey,
			});
			// TODO
			// we need to wait for appview to update, but there's not an efficient
			// query for that, so we use a timeout below
			// -prf
		},
		onSuccess: (data, variables) => {
			// invalidate the members queries (used for rendering the listings)
			// use a timeout to wait for the appview (see above)
			setTimeout(() => {
				void queryClient.invalidateQueries({
					queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
				});
			}, 1e3);

			queryClient.setQueryData<ListWithMembership[]>(RQKEY_WITH_MEMBERSHIP(variables.actorDid), (old) =>
				old?.map((item) => (item.list.uri === variables.listUri ? { ...item, listItem: undefined } : item)),
			);

			queryClient.setQueryData<InfiniteData<AppBskyGraphGetStarterPacksWithMembership.$output>>(
				STARTER_PACKS_WITH_MEMBERSHIPS_RKEY(variables.actorDid),
				(old) => {
					if (!old) return old;

					return {
						...old,
						pages: old.pages.map((page) => ({
							...page,
							starterPacksWithMembership: page.starterPacksWithMembership.map((spWithMembership) => {
								if (
									spWithMembership.starterPack.list &&
									spWithMembership.starterPack.list.uri === variables.listUri
								) {
									return {
										...spWithMembership,
										starterPack: {
											...spWithMembership.starterPack,
											listItemsSample: spWithMembership.starterPack.listItemsSample?.filter(
												(item) => item.subject.did !== variables.actorDid,
											),
											list: {
												...spWithMembership.starterPack.list,
												listItemCount: Math.max(
													0,
													(spWithMembership.starterPack.list.listItemCount ?? 1) - 1,
												),
											},
										},
										listItem: undefined,
									};
								}

								return spWithMembership;
							}),
						})),
					};
				},
			);

			onSuccess?.(data);
		},
		onError,
	});
}
