import type { AppBskyUnspeccedGetPostThreadOtherV2 } from '@atcute/bluesky';

import type { PostThreadParams } from '#/state/queries/thread/types';

export const postThreadQueryKeyRoot = 'post-thread-v2' as const;

export const createPostThreadQueryKey = (props: PostThreadParams) => [postThreadQueryKeyRoot, props] as const;

export const createPostThreadOtherQueryKey = (
	props: Omit<AppBskyUnspeccedGetPostThreadOtherV2.$params, 'anchor'> & {
		anchor?: string;
	},
) => [postThreadQueryKeyRoot, 'other', props] as const;
