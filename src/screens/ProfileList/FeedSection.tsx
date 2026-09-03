import { useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { softReset } from '#/state/events';
import type { FeedDescriptor } from '#/state/queries/feed-descriptor';
import { RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';

import { BlankState } from '#/components/BlankState';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { PostFeed } from '#/components/PostFeed/PostFeed';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import HashtagWideIcon from '#/icons/central/Hashtag_round_outlined_radius1_stroke1.svg';
import PersonPlusIcon from '#/icons/central/PeopleAdd_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useFocusEffect } from '#/router';

interface FeedSectionProps {
	feed: FeedDescriptor;
	isOwner: boolean;
	onPressAddUser: () => void;
}

export function FeedSection({ feed, isOwner, onPressAddUser }: FeedSectionProps) {
	const queryClient = useQueryClient();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [hasNew, setHasNew] = useState(false);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const onScrollToTop = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
		void queryClient.resetQueries({ queryKey: FEED_RQKEY(feed) });
		setHasNew(false);
	};

	useFocusEffect(() => softReset.subscribe(onScrollToTop));

	const renderPostsEmpty = () => {
		return (
			<BlankState
				actions={
					isOwner && (
						<Button
							color="primary"
							label={m['screens.profileList.members.startAdding']()}
							onClick={onPressAddUser}
							size="small"
							variant="solid"
						>
							<ButtonIcon icon={PersonPlusIcon} />
							<ButtonText>{m['screens.profileList.members.startAddingCta']()}</ButtonText>
						</Button>
					)
				}
				icon={HashtagWideIcon}
				message={m['common.feeds.empty']()}
			/>
		);
	};

	return (
		<div>
			<PostFeed
				disablePoll={hasNew}
				feed={feed}
				onHasNew={setHasNew}
				onScrolledDownChange={setIsScrolledDown}
				pollInterval={60e3}
				renderEmptyState={renderPostsEmpty}
				scrollElRef={scrollElRef}
			/>
			{(isScrolledDown || hasNew) && (
				<LoadLatestBtn
					label={m['common.feeds.action.loadNew']()}
					onPress={onScrollToTop}
					showIndicator={hasNew}
				/>
			)}
		</div>
	);
}
