import type { FeedDescriptor } from '#/state/queries/post-feed';

import { EmptyState } from '#/components/EmptyState';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import { PostFeed } from '#/components/PostFeed/PostFeed';

import { m } from '#/paraglide/messages';

interface PostsListProps {
	listUri: string;
}

function renderPostsEmpty() {
	return <EmptyState icon={HashtagWideIcon} iconSize="2xl" message={m['common.feeds.empty']()} />;
}

export function PostsList({ listUri }: PostsListProps) {
	const feed: FeedDescriptor = `list|${listUri}`;

	return <PostFeed enabled feed={feed} pollInterval={60e3} renderEmptyState={renderPostsEmpty} />;
}
