import type { ResourceUri } from '@atcute/lexicons';
import type { Did } from '@atcute/lexicons/syntax';

type AuthorFeedView =
	| { view: 'posts'; showReplies: boolean; showReposts: boolean }
	| { view: 'media'; media: 'all' | 'videos' };

export type FeedDescriptor =
	| { type: 'following' }
	| ({ type: 'author'; did: Did } & AuthorFeedView)
	| { type: 'feedgen'; uri: ResourceUri }
	| { type: 'list'; uri: ResourceUri }
	| { type: 'posts'; uris: ResourceUri[] };

type AuthorFilter =
	| 'posts_and_author_threads'
	| 'posts_with_replies'
	| 'posts_with_media'
	| 'posts_with_video';

export type FeedRequest =
	| Exclude<FeedDescriptor, { type: 'author' }>
	| { type: 'author'; did: Did; filter: AuthorFilter; includePins: boolean };

/**
 * converts a feed view to its API request.
 *
 * @param feed the feed view
 * @returns the API request
 */
export const toFeedRequest = (feed: FeedDescriptor): FeedRequest => {
	if (feed.type !== 'author') {
		return feed;
	}
	if (feed.view === 'media') {
		return {
			type: 'author',
			did: feed.did,
			filter: feed.media === 'videos' ? 'posts_with_video' : 'posts_with_media',
			includePins: false,
		};
	}
	// showReposts is applied client-side.
	return {
		type: 'author',
		did: feed.did,
		filter: feed.showReplies ? 'posts_with_replies' : 'posts_and_author_threads',
		includePins: true,
	};
};
