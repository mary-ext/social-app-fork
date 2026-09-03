import { useRef, useState } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';

import { BlankState } from '#/components/BlankState';
import { ErrorState } from '#/components/ErrorState';
import { List, type ListMethods } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import ListIcon from '#/icons/central/BulletList_round_outlined_radius1_stroke2.svg';
import PersonPlusIcon from '#/icons/central/PeopleAdd_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './AboutSection.css';
import { ListMember } from './components/ListMember';

interface AboutSectionProps {
	list: AppBskyGraphDefs.ListView;
	onPressAddUser: () => void;
}

const MEMBER_ITEM_HEIGHT_ESTIMATE = 130;

export function AboutSection({ list, onPressAddUser }: AboutSectionProps) {
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();
	const scrollElRef = useRef<ListMethods | null>(null);
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const isOwner = list.creator.did === currentAccount?.did;

	const { data, error, fetchNextPage, isError, isFetchingNextPage, isPending, refetch } = useListMembersQuery(
		list.uri,
	);

	const items = data?.pages ? data.pages.flatMap((page) => page.items) : [];

	const onScrollToTop = () => {
		scrollElRef.current?.scrollToOffset({
			animated: false,
			offset: 0,
		});
	};

	if (isError && items.length === 0) {
		return <ErrorState onRetry={() => void refetch()} />;
	}

	if (isPending || !moderationOpts) {
		return <ProfileCard.LoadingPlaceholder />;
	}

	if (items.length === 0) {
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
				icon={ListIcon}
				message={m['screens.profileList.members.empty']()}
			/>
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
		<>
			<List
				ref={scrollElRef}
				data={items}
				estimateHeight={MEMBER_ITEM_HEIGHT_ESTIMATE}
				keyExtractor={(item) => item.subject.did}
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
				ListFooterComponent={
					<ListTail.Frame>
						{isFetchingNextPage ? (
							<ListTail.Pending />
						) : isError ? (
							<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
						) : null}
					</ListTail.Frame>
				}
				ListHeaderComponent={header}
				onEndReached={() => {
					if (isError) {
						return;
					}
					void fetchNextPage();
				}}
				onEndReachedThreshold={2}
				onScrolledDownChange={setIsScrolledDown}
			/>

			{isScrolledDown && (
				<LoadLatestBtn
					label={m['screens.profileList.a11y.scrollToTop']()}
					onPress={onScrollToTop}
					showIndicator={false}
				/>
			)}
		</>
	);
}
