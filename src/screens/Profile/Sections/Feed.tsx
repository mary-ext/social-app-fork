import { useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { type FeedDescriptor, RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { truncateAndInvalidate } from '#/state/queries/util';

import { EmptyState, type EmptyStateButtonProps, type EmptyStateIcon } from '#/components/EmptyState';
import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { PostFeed } from '#/components/PostFeed/PostFeed';

import { m } from '#/paraglide/messages';

import * as css from './Feed.css';

interface FeedSectionProps {
	feed: FeedDescriptor;
	ignoreFilterFor?: string;
	emptyStateMessage?: string;
	emptyStateButton?: EmptyStateButtonProps;
	emptyStateIcon?: EmptyStateIcon | React.ReactElement;
}

export function ProfileFeedSection({
	feed,
	ignoreFilterFor,
	emptyStateMessage,
	emptyStateButton,
	emptyStateIcon,
}: FeedSectionProps) {
	const queryClient = useQueryClient();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [hasNew, setHasNew] = useState(false);
	const [isScrolledDown, setIsScrolledDown] = useState(false);

	const onScrollToTop = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
		void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
		setHasNew(false);
	};

	const renderPostsEmpty = () => {
		return (
			<div className={css.emptyContainer}>
				<EmptyState
					icon={emptyStateIcon || EditIcon}
					iconSize="_3xl"
					message={emptyStateMessage || m['common.post.empty']()}
					button={emptyStateButton}
				/>
			</div>
		);
	};

	return (
		<div>
			<PostFeed
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
