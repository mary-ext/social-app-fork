import type {
	AnyProfileView,
	AppBskyActorDefs,
	AppBskyGraphDefs,
	AppBskyGraphGetStarterPacksWithMembership,
} from '@atcute/bluesky';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';

import { invalidateListMembersQuery } from '#/state/queries/list/cache';
import {
	MEMBERS_ALL_RQKEY as LIST_MEMBERS_ALL_RQKEY,
	RQKEY_WITH_MEMBERSHIP,
} from '#/state/queries/list/keys';
import type { ListWithMembership } from '#/state/queries/list/memberships';
import { ACTOR_WITH_MEMBERSHIP_RQKEY as STARTER_PACKS_WITH_MEMBERSHIPS_RKEY } from '#/state/queries/starter-pack/keys';
import { getClients, useSession } from '#/state/session';

export function useListMembershipAddMutation({
	onSuccess,
	onError,
}: {
	onSuccess?: (data: { uri: ResourceUri; cid: string }) => void;
	onError?: (error: Error) => void;
} = {}) {
	const { currentAccount } = useSession();
	const { pds } = getClients();
	const queryClient = useQueryClient();
	// `subject` (the added profile) drives the optimistic membership cache updates in onSuccess below.
	return useMutation<
		{ uri: ResourceUri; cid: string },
		Error,
		{ actorDid: Did; listUri: ResourceUri; subject?: AnyProfileView }
	>({
		mutationFn: async ({ listUri, actorDid }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			const res = await createRecord(pds!, {
				repo: currentAccount.did,
				record: {
					$type: 'app.bsky.graph.listitem',
					createdAt: new Date().toISOString(),
					list: listUri,
					subject: actorDid,
				},
			});
			// delay invalidation until the appview observes the write.
			return res;
		},
		onSuccess: (data, variables) => {
			// wait before invalidating because the appview may lag.
			setTimeout(() => {
				void invalidateListMembersQuery({ queryClient, uri: variables.listUri });
			}, 1e3);

			if (variables.subject) {
				queryClient.setQueryData<ListWithMembership[]>(RQKEY_WITH_MEMBERSHIP(variables.actorDid), (old) =>
					old?.map((item) =>
						item.list.uri === variables.listUri
							? {
									...item,
									listItem: {
										uri: data.uri,
										// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- every `AnyProfileView` member carries these fields; only `$type` differs
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
						if (!old) {
							return old;
						}

						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- spreading the pages loses the `$type` literals; the values are unchanged
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
														// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- every `AnyProfileView` member carries these fields; only `$type` differs
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
												// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- every `AnyProfileView` member carries these fields; only `$type` differs
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
	const { pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { listUri: ResourceUri; actorDid: Did; membershipUri: ResourceUri }>({
		mutationFn: async ({ membershipUri }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			const membershipUrip = parseCanonicalResourceUri(membershipUri);
			await deleteRecord(pds!, {
				repo: currentAccount.did,
				collection: 'app.bsky.graph.listitem',
				rkey: membershipUrip.rkey,
			});
			// delay invalidation until the appview observes the write.
		},
		onSuccess: (data, variables) => {
			// wait before invalidating because the appview may lag.
			setTimeout(() => {
				void invalidateListMembersQuery({ queryClient, uri: variables.listUri });
			}, 1e3);

			queryClient.setQueryData<AppBskyGraphDefs.ListItemView[]>(
				LIST_MEMBERS_ALL_RQKEY(variables.listUri),
				(old) => old?.filter((item) => item.uri !== variables.membershipUri),
			);

			queryClient.setQueryData<ListWithMembership[]>(RQKEY_WITH_MEMBERSHIP(variables.actorDid), (old) =>
				old?.map((item) => (item.list.uri === variables.listUri ? { ...item, listItem: undefined } : item)),
			);

			queryClient.setQueryData<InfiniteData<AppBskyGraphGetStarterPacksWithMembership.$output>>(
				STARTER_PACKS_WITH_MEMBERSHIPS_RKEY(variables.actorDid),
				(old) => {
					if (!old) {
						return old;
					}

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
