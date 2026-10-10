import { type ReactNode, useRef, useState } from 'react';

import type { FeedDescriptor } from '#/state/queries/feed-descriptor';

import { BlankState } from '#/components/BlankState';
import type { ContentStateIcon } from '#/components/ContentState';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { PostFeed, type PostFeedRef } from '#/components/PostFeed/PostFeed';

import { m } from '#/paraglide/messages';

interface FeedSectionProps {
	feed: FeedDescriptor;
	ignoreFilterFor?: string;
	emptyStateMessage?: string;
	emptyStateActions?: ReactNode;
	emptyStateIcon: ContentStateIcon;
}

export function ProfileFeedSection({
	feed,
	ignoreFilterFor,
	emptyStateMessage,
	emptyStateActions,
	emptyStateIcon,
}: FeedSectionProps) {
	const scrollElRef = useRef<ListMethods | null>(null);
	const feedRef = useRef<PostFeedRef>(null);
	const [hasNew, setHasNew] = useState(false);
	const [isScrolledDown, setIsScrolledDown] = useState(false);

	const onScrollToTop = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
		feedRef.current?.refresh();
		setHasNew(false);
	};

	const renderPostsEmpty = () => {
		return (
			<BlankState
				actions={emptyStateActions}
				icon={emptyStateIcon}
				message={emptyStateMessage || m['common.post.empty']()}
			/>
		);
	};

	return (
		<div>
			<PostFeed
				ref={feedRef}
				feed={feed}
				scrollElRef={scrollElRef}
				onHasNew={setHasNew}
				onScrolledDownChange={setIsScrolledDown}
				renderEmptyState={renderPostsEmpty}
				ignoreFilterFor={ignoreFilterFor}
			/>
			{(isScrolledDown || hasNew) && (
				<LoadLatestBtn
					onPress={onScrollToTop}
					label={m['common.feeds.action.loadNew']()}
					showIndicator={hasNew}
				/>
			)}
		</div>
	);
}
