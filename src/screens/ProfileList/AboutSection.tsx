import { useRef, useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { List, type ListMethods } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

import * as css from './AboutSection.css';
import { ListMember } from './components/ListMember';

interface AboutSectionProps {
	list: AppBskyGraphDefs.ListView;
	onPressAddUser: () => void;
}

export function AboutSection({ list, onPressAddUser }: AboutSectionProps) {
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const isOwner = list.creator.did === currentAccount?.did;

	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isError,
		isFetched,
		isFetching,
		isFetchingNextPage,
		refetch,
	} = useListMembersQuery(list.uri);

	const items = data?.pages ? data.pages.flatMap((page) => page.items) : [];
	const isEmpty = !isFetching && isFetched && items.length === 0;

	const onEndReached = async () => {
		if (isFetching || !hasNextPage || isError) {
			return;
		}
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more list members', { message: err });
		}
	};

	const onScrollToTop = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
	};

	if (!moderationOpts || ((isFetching || !isFetched) && items.length === 0 && !isError)) {
		return <ProfileCard.LoadingPlaceholder />;
	}

	if (isEmpty && isError) {
		return (
			<ListMaybePlaceholder
				errorMessage={cleanError(error)}
				isError={true}
				isLoading={false}
				onRetry={refetch}
			/>
		);
	}

	if (isEmpty) {
		return (
			<div className={css.emptyState}>
				<EmptyState icon={ListIcon} message={m['screens.profileList.members.empty']()} />
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
	}

	const header = isOwner ? (
		<div className={css.header}>
			<Button
				color="primary"
				label={m['screens.profileList.members.add']()}
				onClick={onPressAddUser}
				size="small"
				variant="ghost"
			>
				<ButtonIcon icon={PersonPlusIcon} />
				<ButtonText>{m['common.action.addPeople']()}</ButtonText>
			</Button>
		</div>
	) : undefined;

	return (
		<div>
			<List
				data={items}
				keyExtractor={(item) => item.subject.did}
				ListFooterComponent={
					<ListFooter
						error={cleanError(error)}
						isFetchingNextPage={isFetchingNextPage}
						onRetry={fetchNextPage}
					/>
				}
				ListHeaderComponent={header}
				onEndReached={() => void onEndReached()}
				onEndReachedThreshold={2}
				onScrolledDownChange={setIsScrolledDown}
				ref={scrollElRef}
				renderItem={({ index, item }) => (
					<ListMember
						index={index}
						isOwner={isOwner}
						list={list.uri}
						membershipUri={item.uri}
						moderationOpts={moderationOpts}
						profile={item.subject}
					/>
				)}
			/>
			{isScrolledDown && (
				<LoadLatestBtn
					label={m['screens.profileList.a11y.scrollToTop']()}
					onPress={onScrollToTop}
					showIndicator={false}
				/>
			)}
		</div>
	);
}
