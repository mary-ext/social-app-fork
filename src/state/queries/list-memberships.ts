/**
 * NOTE
 *
 * This query is a temporary solution to our lack of server API for querying user membership in an API. It is
 * extremely inefficient.
 *
 * THIS SHOULD ONLY BE USED IN MODALS FOR MODIFYING A USER'S LIST MEMBERSHIP! Use the list-members query for
 * rendering a list's members.
 *
 * It works by fetching _all_ of the user's list item records and querying or manipulating that cache. For
 * users with large lists, it will fall down completely, so be very conservative about how you use it.
 *
 * -prf
 */

import { type AppBskyActorDefs, type AppBskyGraphGetStarterPacksWithMembership } from '@atcute/bluesky';
import { type Did, type ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { type InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord, listRecords } from '#/lib/api/records';

import { STALE } from '#/state/queries';
import { RQKEY as LIST_MEMBERS_RQKEY } from '#/state/queries/list-members';
import { useClients, useSession } from '#/state/session';

import type * as bsky from '#/types/bsky';

import { RQKEY_WITH_MEMBERSHIP as STARTER_PACKS_WITH_MEMBERSHIPS_RKEY } from './actor-starter-packs';

// sanity limit is SANITY_PAGE_LIMIT*PAGE_SIZE total records
const SANITY_PAGE_LIMIT = 1000;
const PAGE_SIZE = 100;
// ...which comes 100,000k list members

const RQKEY_ROOT = 'list-memberships';
export const RQKEY = () => [RQKEY_ROOT];

export interface ListMembersip {
	membershipUri: string;
	listUri: string;
	actorDid: string;
}

/** This API is dangerous! Read the note above! */
export function useDangerousListMembershipsQuery() {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	return useQuery<ListMembersip[]>({
		staleTime: STALE.MINUTES.FIVE,
		queryKey: RQKEY(),
		async queryFn() {
			if (!currentAccount) {
				return [];
			}
			let cursor: string | undefined;
			let arr: ListMembersip[] = [];
			for (let i = 0; i < SANITY_PAGE_LIMIT; i++) {
				const res = await listRecords(pds!, {
					collection: 'app.bsky.graph.listitem',
					cursor,
					limit: PAGE_SIZE,
					repo: currentAccount.did as Did,
				});
				arr = arr.concat(
					res.records.map((r) => ({
						membershipUri: r.uri,
						listUri: r.value.list,
						actorDid: r.value.subject,
					})),
				);
				cursor = res.cursor;
				if (!cursor) {
					break;
				}
			}
			return arr;
		},
	});
}

/**
 * Returns undefined for pending, false for not a member, and string for a member (the URI of the membership
 * record)
 */
export function getMembership(
	memberships: ListMembersip[] | undefined,
	list: string,
	actor: string,
): string | false | undefined {
	if (!memberships) {
		return undefined;
	}
	const membership = memberships.find((m) => m.listUri === list && m.actorDid === actor);
	return membership ? membership.membershipUri : false;
}

export function useListMembershipAddMutation({
	subject,
	onSuccess,
	onError,
}: {
	/** Needed for optimistic update of starter pack query */
	subject?: bsky.profile.AnyProfileView;
	onSuccess?: (data: { uri: string; cid: string }) => void;
	onError?: (error: Error) => void;
} = {}) {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: string; cid: string }, Error, { listUri: string; actorDid: string }>({
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
			// manually update the cache; a refetch is too expensive
			let memberships = queryClient.getQueryData<ListMembersip[]>(RQKEY());
			if (memberships) {
				memberships = memberships
					// avoid dups
					.filter((m) => !(m.actorDid === variables.actorDid && m.listUri === variables.listUri))
					.concat([
						{
							...variables,
							membershipUri: data.uri,
						},
					]);
				queryClient.setQueryData(RQKEY(), memberships);
			}
			// invalidate the members queries (used for rendering the listings)
			// use a timeout to wait for the appview (see above)
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
				});
			}, 1e3);

			// update WITH_MEMBERSHIPS query

			if (subject) {
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
														subject: subject as AppBskyActorDefs.ProfileViewBasic,
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
												subject: subject as AppBskyActorDefs.ProfileViewBasic,
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
			// manually update the cache; a refetch is too expensive
			let memberships = queryClient.getQueryData<ListMembersip[]>(RQKEY());
			if (memberships) {
				memberships = memberships.filter(
					(m) => !(m.actorDid === variables.actorDid && m.listUri === variables.listUri),
				);
				queryClient.setQueryData(RQKEY(), memberships);
			}
			// invalidate the members queries (used for rendering the listings)
			// use a timeout to wait for the appview (see above)
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
				});
			}, 1e3);

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
