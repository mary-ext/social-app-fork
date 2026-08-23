import type { AppBskyFeedDefs, AppBskyUnspeccedGetPostThreadV2 } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { usePostThreadContext } from '#/state/queries/usePostThread/context';

export function useUpdatePostThreadThreadgateQueryCache() {
	const qc = useQueryClient();
	const context = usePostThreadContext();

	return (threadgate: AppBskyFeedDefs.ThreadgateView) => {
		if (!context) {
			return;
		}

		qc.setQueryData<AppBskyUnspeccedGetPostThreadV2.$output>(context.postThreadQueryKey, (data) => {
			if (!data) {
				return;
			}

			// depth 0 is the thread anchor.
			for (let i = 0; i < data.thread.length; i++) {
				const item = data.thread[i]!;

				if (item.depth !== 0 || item.value.$type !== 'app.bsky.unspecced.defs#threadItemPost') {
					continue;
				}

				const thread = [...data.thread];
				thread[i] = {
					...item,
					value: {
						...item.value,
						post: {
							...item.value.post,
							threadgate,
						},
					},
				};

				return { ...data, thread };
			}

			return data;
		});
	};
}
