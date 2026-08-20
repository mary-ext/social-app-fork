import type { ResourceUri } from '@atcute/lexicons';
import type { Did } from '@atcute/lexicons/syntax';

type AuthorFilter =
	| 'posts_with_replies'
	| 'posts_no_replies'
	| 'posts_and_author_threads'
	| 'posts_with_media'
	| 'posts_with_video';

/** feed query parameters */
export type FeedDescriptor =
	| { type: 'following' }
	| { type: 'author'; did: Did; filter: AuthorFilter }
	| { type: 'feedgen'; uri: ResourceUri }
	| { type: 'list'; uri: ResourceUri }
	| { type: 'posts'; uris: ResourceUri[] };
