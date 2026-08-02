import { useCallback, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { softReset } from '#/state/events';
import { type FeedDescriptor, RQKEY as FEED_RQKEY } from '#/state/queries/post-feed';

import { EmptyState } from '#/components/EmptyState';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import { PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { PostFeed } from '#/components/PostFeed/PostFeed';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { useFocusEffect } from '#/routes';

import * as css from './FeedSection.css';

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

	const renderPostsEmpty = useCallback(() => {
		return (
			<div className={css.emptyState}>
				<EmptyState icon={HashtagWideIcon} iconSize="_2xl" message={m['common.feeds.empty']()} />
				{isOwner && (
					<Button
						color="primary"
						label={m['screens.profileList.members.startAdding']()}
						onClick={onPressAddUser}
						size="small"
					>
						<ButtonIcon icon={PersonPlusIcon} />
						<ButtonText>{m['screens.profileList.members.startAddingCta']()}</ButtonText>
					</Button>
				)}
			</div>
		);
	}, [isOwner, onPressAddUser]);

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
