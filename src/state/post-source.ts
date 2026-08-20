import type { ResourceUri } from '@atcute/lexicons';

import { useConstant } from '#/lib/hooks/use-constant';

import type { FeedFeedbackTarget } from '#/state/feed-feedback';

import { useRouter } from '#/router';

/** metadata from the feed entry that opened a post. */
export type PostSource = {
	feed?: FeedFeedbackTarget;
	feedContext?: string;
	reqId?: string;
	via?: { uri: ResourceUri; cid: string };
};

// version the key so restored entries with older payloads are ignored.
const STATE_KEY = 'postSource@1';

type PostSourceState = { [STATE_KEY]: PostSource };

const hasPostSource = (state: unknown): state is PostSourceState => {
	return typeof state === 'object' && state !== null && STATE_KEY in state;
};

/**
 * creates history state for a post source.
 *
 * @param source the post source
 * @returns history state when the source is not empty
 */
export const postSourceState = (source: PostSource): PostSourceState | undefined => {
	const carries = source.feed || source.feedContext || source.reqId || source.via;
	return carries ? { [STATE_KEY]: source } : undefined;
};

/**
 * reads the post source from the initial history entry.
 *
 * @returns the post source when the post was opened from a feed
 */
export const usePostSource = (): PostSource | undefined => {
	const router = useRouter();

	// mounted screens can remain alive after their history entry is no longer active.
	return useConstant(() => {
		const state = router.location.state;
		return hasPostSource(state) ? state[STATE_KEY] : undefined;
	});
};
