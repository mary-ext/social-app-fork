import { useRef, useState } from 'react';

import { softReset } from '#/state/events';
import type { FeedDescriptor } from '#/state/queries/feed-descriptor';

import { BlankState } from '#/components/BlankState';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { PostFeed, type PostFeedRef } from '#/components/PostFeed/PostFeed';
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
				ref={feedRef}
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
