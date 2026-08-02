import type { FeedDescriptor } from '#/state/queries/post-feed';

import { EmptyState } from '#/components/EmptyState';
import { PostFeed } from '#/components/PostFeed/PostFeed';

import HashtagWideIcon from '#/icons/central/Hashtag_round_outlined_radius1_stroke1.svg';
import { m } from '#/paraglide/messages';

interface PostsListProps {
	listUri: string;
}

function renderPostsEmpty() {
	return <EmptyState icon={HashtagWideIcon} iconSize="_2xl" message={m['common.feeds.empty']()} />;
}

export function PostsList({ listUri }: PostsListProps) {
	const feed: FeedDescriptor = `list|${listUri}`;

	return <PostFeed feed={feed} pollInterval={60e3} renderEmptyState={renderPostsEmpty} />;
}
