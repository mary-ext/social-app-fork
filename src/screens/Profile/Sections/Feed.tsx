import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { type FeedDescriptor, RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';
import { truncateAndInvalidate } from '#/state/queries/util';

import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState, type EmptyStateButtonProps, type EmptyStateIcon } from '#/view/com/util/EmptyState';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { atoms as a, useTheme } from '#/alf';

import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import type { ListMethods } from '#/components/List/List';
import { Text } from '#/components/Typography';

interface FeedSectionProps {
	feed: FeedDescriptor;
	isFocused: boolean;
	ignoreFilterFor?: string;
	emptyStateMessage?: string;
	emptyStateButton?: EmptyStateButtonProps;
	emptyStateIcon?: EmptyStateIcon | React.ReactElement;
}

export function ProfileFeedSection({
	feed,
	isFocused,
	ignoreFilterFor,
	emptyStateMessage,
	emptyStateButton,
	emptyStateIcon,
}: FeedSectionProps) {
	const { t: l } = useLingui();
	const queryClient = useQueryClient();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [hasNew, setHasNew] = useState(false);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const onScrollToTop = useCallback(() => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
		void truncateAndInvalidate(queryClient, FEED_RQKEY(feed));
		setHasNew(false);
	}, [queryClient, feed, setHasNew]);

	const renderPostsEmpty = useCallback(() => {
		return (
			<View style={[a.flex_1, a.justify_center, a.align_center]}>
				<EmptyState
					style={{ width: '100%' }}
					icon={emptyStateIcon || EditIcon}
					iconSize="3xl"
					message={emptyStateMessage || l`No posts yet`}
					button={emptyStateButton}
				/>
			</View>
		);
	}, [l, emptyStateButton, emptyStateIcon, emptyStateMessage]);

	return (
		<View>
			<PostFeed
				testID="postsFeed"
				enabled={isFocused}
				feed={feed}
				scrollElRef={scrollElRef}
				onHasNew={setHasNew}
				onScrolledDownChange={setIsScrolledDown}
				renderEmptyState={renderPostsEmpty}
				renderEndOfFeed={ProfileEndOfFeed}
				ignoreFilterFor={ignoreFilterFor}
			/>
			{(isScrolledDown || hasNew) && (
				<LoadLatestBtn onPress={onScrollToTop} label={l`Load new posts`} showIndicator={hasNew} />
			)}
		</View>
	);
}

function ProfileEndOfFeed() {
	const t = useTheme();

	return (
		<View style={[a.w_full, a.py_5xl, a.border_t, t.atoms.border_contrast_low]}>
			<Text style={[t.atoms.text_contrast_medium, a.text_center]}>
				<Trans>End of feed</Trans>
			</Text>
		</View>
	);
}
