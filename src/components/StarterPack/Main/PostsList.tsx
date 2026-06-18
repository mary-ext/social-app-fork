import { useCallback } from 'react';
import { View } from 'react-native';
import { useLingui } from '@lingui/react/macro';

import type { FeedDescriptor } from '#/state/queries/post-feed';

import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';

import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';

interface PostsListProps {
	listUri: string;
}

export function PostsList({ listUri }: PostsListProps) {
	const feed: FeedDescriptor = `list|${listUri}`;
	const { t: l } = useLingui();

	const renderPostsEmpty = useCallback(() => {
		return <EmptyState icon={HashtagWideIcon} iconSize="2xl" message={l`This feed is empty.`} />;
	}, [l]);

	return (
		<View>
			<PostFeed enabled feed={feed} pollInterval={60e3} renderEmptyState={renderPostsEmpty} />
		</View>
	);
}
