import { FeedTuner } from '#/state/queries/feed-tuner';

import { useContentLanguages } from '../preferences/languages';
import { useSession } from '../session';
import type { FeedDescriptor } from './feed-descriptor';
import { usePreferencesQuery } from './preferences';

export function useFeedTuners(feedDesc: FeedDescriptor) {
	const contentLanguages = useContentLanguages();
	const { data: preferences } = usePreferencesQuery();
	const { currentAccount } = useSession();

	if (feedDesc.type === 'author') {
		if (feedDesc.filter === 'posts_with_replies') {
			// TODO: Do this on the server instead.
			return [FeedTuner.removeReposts];
		}
	}
	if (feedDesc.type === 'feedgen') {
		return [FeedTuner.preferredLangOnly(contentLanguages), FeedTuner.removeMutedThreads];
	}
	if (feedDesc.type === 'following' || feedDesc.type === 'list') {
		const feedTuners = [FeedTuner.removeOrphans];

		if (preferences?.feedViewPrefs.hideReposts) {
			feedTuners.push(FeedTuner.removeReposts);
		}
		if (preferences?.feedViewPrefs.hideReplies) {
			feedTuners.push(FeedTuner.removeReplies);
		} else {
			feedTuners.push(
				FeedTuner.followedRepliesOnly({
					userDid: currentAccount?.did || '',
				}),
			);
		}
		if (preferences?.feedViewPrefs.hideQuotePosts) {
			feedTuners.push(FeedTuner.removeQuotePosts);
		}
		feedTuners.push(FeedTuner.dedupThreads);
		feedTuners.push(FeedTuner.removeMutedThreads);

		return feedTuners;
	}
	return [];
}
