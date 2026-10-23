import type { FeedDescriptor } from '#/lib/feeds/descriptor';

import { useContentLanguages } from '#/state/preferences/languages';
import type { FeedTunerFn } from '#/state/queries/feed/lib/feed-tuner';
import {
	dedupThreads,
	followedRepliesOnly,
	preferredLangOnly,
	removeMutedThreads,
	removeOrphans,
	removeQuotePosts,
	removeReplies,
	removeReposts,
} from '#/state/queries/feed/lib/feed-tuner-fns';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { useSession } from '#/state/session';

export function useFeedTuners(feedDesc: FeedDescriptor): FeedTunerFn[] {
	const contentLanguages = useContentLanguages();
	const { data: preferences } = usePreferencesQuery();
	const { currentAccount } = useSession();

	if (feedDesc.type === 'author' && feedDesc.view === 'posts' && !feedDesc.showReposts) {
		return [removeReposts];
	}
	if (feedDesc.type === 'feedgen') {
		return [preferredLangOnly(contentLanguages), removeMutedThreads];
	}
	if (feedDesc.type === 'following' || feedDesc.type === 'list') {
		const feedTuners: FeedTunerFn[] = [removeOrphans];

		if (preferences?.feedViewPrefs.hideReposts) {
			feedTuners.push(removeReposts);
		}
		if (preferences?.feedViewPrefs.hideReplies) {
			feedTuners.push(removeReplies);
		} else {
			feedTuners.push(
				followedRepliesOnly({
					userDid: currentAccount?.did || '',
				}),
			);
		}
		if (preferences?.feedViewPrefs.hideQuotePosts) {
			feedTuners.push(removeQuotePosts);
		}
		feedTuners.push(dedupThreads);
		feedTuners.push(removeMutedThreads);

		return feedTuners;
	}
	return [];
}
