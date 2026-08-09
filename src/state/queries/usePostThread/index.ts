import { useMemo, useState } from 'react';

import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useThreadPreferences } from '#/state/queries/preferences/useThreadPreferences';
import {
	LINEAR_VIEW_BELOW,
	LINEAR_VIEW_BF,
	TREE_VIEW_BELOW,
	TREE_VIEW_BELOW_DESKTOP,
	TREE_VIEW_BF,
} from '#/state/queries/usePostThread/const';
import type { PostThreadContextType } from '#/state/queries/usePostThread/context';
import { createCacheMutator, getThreadPlaceholder } from '#/state/queries/usePostThread/queryCache';
import { buildThread, sortAndAnnotateThreadItems } from '#/state/queries/usePostThread/traversal';
import {
	createPostThreadOtherQueryKey,
	createPostThreadQueryKey,
	type ThreadItem,
	type UsePostThreadQueryResult,
} from '#/state/queries/usePostThread/types';
import { getThreadgateRecord } from '#/state/queries/usePostThread/utils';
import * as views from '#/state/queries/usePostThread/views';
import { getClients, useSession } from '#/state/session';
import { useHiddenReplyUris } from '#/state/threadgate-hidden-replies';

export * from '#/state/queries/usePostThread/context';
export { useUpdatePostThreadThreadgateQueryCache } from '#/state/queries/usePostThread/queryCache';
export * from '#/state/queries/usePostThread/types';

export function usePostThread({ anchor }: { anchor?: ResourceUri }) {
	const qc = useQueryClient();
	const { appview } = getClients();
	const { hasSession } = useSession();
	const { gtPhone } = useBreakpoints();
	const moderationOpts = useModerationOpts();
	const {
		isLoaded: isThreadPreferencesLoaded,
		sort,
		setSort: baseSetSort,
		view,
		setView: baseSetView,
	} = useThreadPreferences();
	const below = view === 'linear' ? LINEAR_VIEW_BELOW : gtPhone ? TREE_VIEW_BELOW_DESKTOP : TREE_VIEW_BELOW;

	const postThreadQueryKey = createPostThreadQueryKey({
		anchor,
		sort,
		view,
	});
	const postThreadOtherQueryKey = createPostThreadOtherQueryKey({
		anchor,
	});

	const query = useQuery<UsePostThreadQueryResult>({
		queryKey: postThreadQueryKey,
		enabled: isThreadPreferencesLoaded && !!anchor && !!moderationOpts,
		async queryFn() {
			const data = await ok(
				appview.get('app.bsky.unspecced.getPostThreadV2', {
					params: {
						anchor: anchor!,
						branchingFactor: view === 'linear' ? LINEAR_VIEW_BF : TREE_VIEW_BF,
						below,
						sort,
					},
				}),
			);

			const result = {
				thread: data.thread || [],
				threadgate: data.threadgate,
				hasOtherReplies: data.hasOtherReplies,
			};

			const record = getThreadgateRecord(result.threadgate);
			if (result.threadgate && record) {
				result.threadgate.record = record;
			}

			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `record` was replaced with the parsed record above
			return result as UsePostThreadQueryResult;
		},
		placeholderData() {
			if (!anchor) {
				return;
			}
			const placeholder = getThreadPlaceholder(qc, anchor);
			const thread = placeholder ? [placeholder] : [];
			return { thread, threadgate: undefined, hasOtherReplies: false };
		},
		select(data) {
			const record = getThreadgateRecord(data.threadgate);
			if (data.threadgate && record) {
				data.threadgate.record = record;
			}
			return data;
		},
	});

	const thread = useMemo(() => query.data?.thread || [], [query.data?.thread]);
	const threadgate = query.data?.threadgate;
	const threadgateHiddenReplies = useHiddenReplyUris(threadgate?.record);
	const hasOtherThreadItems = !!query.data?.hasOtherReplies;
	const [otherItemsVisible, setOtherItemsVisible] = useState(false);

	const mutator = useMemo(
		() =>
			createCacheMutator({
				params: { view, below },
				postThreadQueryKey,
				postThreadOtherQueryKey,
				queryClient: qc,
			}),
		[qc, view, below, postThreadQueryKey, postThreadOtherQueryKey],
	);

	const additionalQueryEnabled = hasOtherThreadItems && otherItemsVisible;
	const additionalItemsQuery = useQuery({
		queryKey: postThreadOtherQueryKey,
		enabled: additionalQueryEnabled,
		async queryFn() {
			const data = await ok(
				appview.get('app.bsky.unspecced.getPostThreadOtherV2', {
					params: { anchor: anchor! },
				}),
			);
			return data;
		},
	});
	const serverOtherThreadItems: ThreadItem[] = useMemo(() => {
		if (!additionalQueryEnabled) {
			return [];
		}
		if (additionalItemsQuery.isLoading) {
			return Array.from({ length: 2 }).map((_, i) =>
				views.skeleton({
					key: `other-reply-${i}`,
					item: 'reply',
				}),
			);
		} else if (additionalItemsQuery.isError) {
			return [];
		} else if (additionalItemsQuery.data?.thread) {
			const { threadItems } = sortAndAnnotateThreadItems(additionalItemsQuery.data.thread, {
				view,
				skipModerationHandling: true,
				threadgateHiddenReplies,
				moderationOpts: moderationOpts!,
			});
			return threadItems;
		} else {
			return [];
		}
	}, [view, additionalQueryEnabled, additionalItemsQuery, threadgateHiddenReplies, moderationOpts]);

	const setSort: typeof baseSetSort = (nextSort) => {
		setOtherItemsVisible(false);
		baseSetSort(nextSort);
	};

	const setView: typeof baseSetView = (nextView) => {
		setOtherItemsVisible(false);
		baseSetView(nextView);
	};

	const { threadItems, otherThreadItems } = useMemo(() => {
		return sortAndAnnotateThreadItems(thread, {
			view,
			threadgateHiddenReplies,
			moderationOpts: moderationOpts!,
		});
	}, [thread, threadgateHiddenReplies, moderationOpts, view]);

	const items = useMemo(() => {
		return buildThread({
			threadItems,
			otherThreadItems,
			serverOtherThreadItems,
			isLoading: query.isPlaceholderData,
			hasSession,
			hasOtherThreadItems,
			otherItemsVisible,
			showOtherItems: () => setOtherItemsVisible(true),
		});
	}, [
		threadItems,
		otherThreadItems,
		serverOtherThreadItems,
		query.isPlaceholderData,
		hasSession,
		hasOtherThreadItems,
		otherItemsVisible,
		setOtherItemsVisible,
	]);

	const context: PostThreadContextType = {
		postThreadQueryKey,
		postThreadOtherQueryKey,
	};
	return {
		context,
		state: {
			isFetching: query.isFetching,
			isPlaceholderData: query.isPlaceholderData,
			error: query.error,
			sort,
			view,
			otherItemsVisible,
		},
		data: {
			items,
			threadgate,
		},
		actions: {
			insertReplies: mutator.insertReplies,
			refetch: query.refetch,
			setSort,
			setView,
		},
	};
}
