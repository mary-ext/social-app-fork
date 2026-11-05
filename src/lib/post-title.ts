import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { isInvalidHandle } from '#/lib/display-names';

import { m } from '#/paraglide/messages';

/**
 * @param post the post, once loaded
 * @returns "Post by @handle", or the generic post title until a valid author handle is known
 */
export const postPageTitle = (post: AppBskyFeedDefs.PostView | undefined): string => {
	if (post && !isInvalidHandle(post.author.handle)) {
		return m['common.a11y.postByAuthor']({ handle: post.author.handle });
	}
	return m['navigation.post.title']();
};
