import type {
	ChatBskyActorDefs,
	ChatBskyGroupApproveJoinRequest,
	ChatBskyGroupListJoinRequests,
	ChatBskyGroupRejectJoinRequest,
} from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { getClients } from '#/state/session';

import { logger } from '#/logger';

import { listConvoMembersQueryKey } from './list-convo-members';
import { createListJoinRequestsQueryKey } from './list-join-requests';

type JoinRequestAction = 'approve' | 'reject';

type JoinRequestOutput<A extends JoinRequestAction> = A extends 'approve'
	? ChatBskyGroupApproveJoinRequest.$output
	: ChatBskyGroupRejectJoinRequest.$output;

export function useJoinRequestMutation<A extends JoinRequestAction>(
	action: A,
	convoId: string | undefined,
	{
		onSuccess,
		onError,
	}: {
		onSuccess?: (data: JoinRequestOutput<A>) => void;
		onError?: (error: Error) => void;
	},
) {
	const queryClient = useQueryClient();
	const { chat } = getClients();

	return useMutation({
		mutationFn: async ({ member }: { member: Did }) => {
			if (!convoId) {
				throw new Error('No convoId provided');
			}
			if (!chat) {
				throw new Error('Not signed in');
			}
			const endpoint =
				action === 'approve' ? 'chat.bsky.group.approveJoinRequest' : 'chat.bsky.group.rejectJoinRequest';
			const data = await ok(chat.post(endpoint, { input: { convoId, member } }));
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the conditional type can't follow the runtime branch that picked `endpoint`
			return data as JoinRequestOutput<A>;
		},
		onMutate: ({ member }) => {
			if (!convoId) {
				return;
			}

			const requestsKey = createListJoinRequestsQueryKey({ convoId });
			const prevRequests =
				queryClient.getQueryData<InfiniteData<ChatBskyGroupListJoinRequests.$output>>(requestsKey);

			const requestedByProfile = prevRequests?.pages
				.flatMap((page) => page.requests)
				.find((request) => request.requestedBy.did === member)?.requestedBy;

			queryClient.setQueryData<InfiniteData<ChatBskyGroupListJoinRequests.$output>>(requestsKey, (prev) => {
				if (!prev?.pages) {
					return prev;
				}
				return {
					...prev,
					pages: prev.pages.map((page) => ({
						...page,
						requests: page.requests.filter((request) => request.requestedBy.did !== member),
					})),
				};
			});

			let prevMembers: ChatBskyActorDefs.ProfileViewBasic[] | undefined;
			if (action === 'approve' && requestedByProfile) {
				const membersKey = listConvoMembersQueryKey(convoId);
				prevMembers = queryClient.getQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(membersKey);
				queryClient.setQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(membersKey, (prev) => {
					if (!prev) {
						return prev;
					}
					if (prev.some((m) => m.did === member)) {
						return prev;
					}
					return [...prev, requestedByProfile];
				});
			}

			return { prevRequests, prevMembers };
		},
		onSuccess: (data) => {
			if (convoId) {
				void queryClient.invalidateQueries({
					queryKey: createListJoinRequestsQueryKey({ convoId }),
				});
				if (action === 'approve') {
					void queryClient.invalidateQueries({
						queryKey: listConvoMembersQueryKey(convoId),
					});
				}
			}
			onSuccess?.(data);
		},
		onError: (error, _variables, context) => {
			logger.error(error);
			if (convoId && context?.prevRequests) {
				queryClient.setQueryData(createListJoinRequestsQueryKey({ convoId }), context.prevRequests);
			}
			if (convoId && action === 'approve' && context?.prevMembers) {
				queryClient.setQueryData(listConvoMembersQueryKey(convoId), context.prevMembers);
			}
			onError?.(error);
		},
	});
}
