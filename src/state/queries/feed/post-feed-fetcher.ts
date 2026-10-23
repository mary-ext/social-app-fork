import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import type { Client } from '@atcute/client';

import { isDocumentVisible } from '#/lib/browser/visibility';
import { serializeUserInterests } from '#/lib/bsky-topics';
import { type FeedDescriptor, type FeedRequest, toFeedRequest } from '#/lib/feeds/descriptor';
import { PostFeedErrorCode } from '#/lib/feeds/post-feed-error';
import { toModerationPreferences } from '#/lib/moderation/preferences';
import type { BskyPreferences } from '#/lib/moderation/preferences-types';
import { DEFAULT_LOGGED_OUT_PREFERENCES } from '#/lib/preferences/const';

import { AuthorFeedAPI } from '#/state/queries/feed/lib/api/author';
import { CustomFeedAPI } from '#/state/queries/feed/lib/api/custom';
import { FollowingFeedAPI } from '#/state/queries/feed/lib/api/following';
import { ListFeedAPI } from '#/state/queries/feed/lib/api/list';
import { PostListFeedAPI } from '#/state/queries/feed/lib/api/posts';
import type { FeedAPI } from '#/state/queries/feed/lib/api/types';
import type { FeedPage, FeedPageUnselected } from '#/state/queries/feed/types';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { getClients, useSession } from '#/state/session';

/** minimum number of posts required in a single page of results */
export const MIN_POSTS = 30;

/**
 * provides page fetching and new-post polling for a feed.
 *
 * @param feedDesc the feed to fetch
 * @returns `fetchPage` by cursor and `pollLatest` for unseen posts that pass feed filters; polling is skipped
 *   while the document is hidden
 */
export function usePostFeedFetcher(feedDesc: FeedDescriptor) {
	const { data: preferences } = usePreferencesQuery();
	const userInterests = serializeUserInterests(preferences);
	const { appview } = getClients();
	const { hasSession } = useSession();

	const createFeedApi = (): FeedAPI =>
		createApi({
			request: toFeedRequest(feedDesc),
			appview,
			userInterests,
		});

	const fetchPage = async (cursor: string | undefined, signal?: AbortSignal): Promise<FeedPageUnselected> => {
		const res = await createFeedApi().fetch({ cursor, limit: MIN_POSTS, signal });

		// public feeds must contain at least one post allowed by moderation.
		if (!hasSession) {
			assertSomePostsPassModeration(
				res.feed,
				preferences?.moderationPrefs || DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
			);
		}

		return {
			cursor: res.cursor,
			feed: res.feed,
			fetchedAt: Date.now(),
		};
	};

	const pollLatest = async (page: FeedPage): Promise<boolean> => {
		if (!isDocumentVisible()) {
			return false;
		}

		const post = await createFeedApi().peekLatest();
		return post !== undefined && page.tuner.tune([post], { dryRun: true }).length > 0;
	};

	return { fetchPage, pollLatest };
}

function createApi({
	request,
	userInterests,
	appview,
}: {
	request: FeedRequest;
	userInterests?: string;
	appview: Client;
}) {
	switch (request.type) {
		case 'following': {
			return new FollowingFeedAPI({ appview });
		}
		case 'author': {
			return new AuthorFeedAPI({
				appview,
				feedParams: { actor: request.did, filter: request.filter, includePins: request.includePins },
			});
		}
		case 'feedgen': {
			return new CustomFeedAPI({
				appview,
				feedParams: { feed: request.uri },
				userInterests,
			});
		}
		case 'list': {
			return new ListFeedAPI({ appview, feedParams: { list: request.uri } });
		}
		case 'posts': {
			return new PostListFeedAPI({ appview, feedParams: { uris: request.uris } });
		}
	}
}

function assertSomePostsPassModeration(
	feed: AppBskyFeedDefs.FeedViewPost[],
	moderationPrefs: BskyPreferences['moderationPrefs'],
) {
	if (feed.length === 0) {
		return true;
	}

	let somePostsPassModeration = false;

	for (const item of feed) {
		const moderation = moderatePost(item.post, {
			viewerDid: undefined,
			prefs: toModerationPreferences(moderationPrefs),
		});

		if (getDisplayRestrictions(moderation, DisplayContext.ContentList).filters.length === 0) {
			somePostsPassModeration = true;
		}
	}

	if (!somePostsPassModeration) {
		throw new Error(PostFeedErrorCode.FeedSignedInOnly);
	}
}
