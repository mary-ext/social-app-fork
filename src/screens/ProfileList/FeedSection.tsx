import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { listenSoftReset } from '#/state/events';
import { type FeedDescriptor, RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';

import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import { PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import type { ListMethods } from '#/components/List/List';

interface FeedSectionProps {
	feed: FeedDescriptor;
	isFocused: boolean;
	isOwner: boolean;
	onPressAddUser: () => void;
}

export function FeedSection({ feed, isFocused, isOwner, onPressAddUser }: FeedSectionProps) {
	const queryClient = useQueryClient();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [hasNew, setHasNew] = useState(false);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const isScreenFocused = useIsFocused();
	const { t: l } = useLingui();

	const onScrollToTop = useCallback(() => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
		void queryClient.resetQueries({ queryKey: FEED_RQKEY(feed) });
		setHasNew(false);
	}, [queryClient, feed, setHasNew]);

	useEffect(() => {
		if (!isScreenFocused) {
			return;
		}
		return listenSoftReset(onScrollToTop);
	}, [onScrollToTop, isScreenFocused]);

	const renderPostsEmpty = useCallback(() => {
		return (
			<View style={[a.gap_xl, a.align_center]}>
				<EmptyState icon={HashtagWideIcon} iconSize="2xl" message={l`This feed is empty.`} />
				{isOwner && (
					<Button label={l`Start adding people`} onPress={onPressAddUser} color="primary" size="small">
						<ButtonIcon icon={PersonPlusIcon} />
						<ButtonText>
							<Trans>Start adding people!</Trans>
						</ButtonText>
					</Button>
				)}
			</View>
		);
	}, [l, onPressAddUser, isOwner]);

	return (
		<View>
			<PostFeed
				testID="listFeed"
				enabled={isFocused}
				feed={feed}
				pollInterval={60e3}
				disablePoll={hasNew}
				scrollElRef={scrollElRef}
				onHasNew={setHasNew}
				onScrolledDownChange={setIsScrolledDown}
				renderEmptyState={renderPostsEmpty}
			/>
			{(isScrolledDown || hasNew) && (
				<LoadLatestBtn onPress={onScrollToTop} label={l`Load new posts`} showIndicator={hasNew} />
			)}
		</View>
	);
}
