import { type JSX, useState } from 'react';
import { Dimensions, type StyleProp, View, type ViewStyle } from 'react-native';

import type { AnyProfileView, AppBskyGraphDefs } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useListMembersQuery } from '#/state/queries/list-members';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { List, type ListRef } from '#/view/com/util/List';
import { ProfileCardFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { UserAddRemoveListsDialog } from '#/components/dialogs/lists/UserAddRemoveListsDialog';
import { ListFooter } from '#/components/Lists';
import * as ProfileCard from '#/components/ProfileCard';

import { m } from '#/paraglide/messages';

const LOADING_ITEM = { _reactKey: '__loading__' } as const;
const EMPTY_ITEM = { _reactKey: '__empty__' } as const;
const ERROR_ITEM = { _reactKey: '__error__' } as const;
const LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' } as const;

type ListMemberItem =
	| AppBskyGraphDefs.ListItemView
	| typeof EMPTY_ITEM
	| typeof ERROR_ITEM
	| typeof LOADING_ITEM
	| typeof LOAD_MORE_ERROR_ITEM;
type ListMemberSentinel = Exclude<ListMemberItem, AppBskyGraphDefs.ListItemView>;

const isListMemberSentinel = (item: ListMemberItem): item is ListMemberSentinel => {
	return '_reactKey' in item;
};

export function ListMembers({
	list,
	style,
	scrollElRef,
	onScrolledDownChange,
	onPressTryAgain,
	renderHeader,
	renderEmptyState,
	testID,
	headerOffset = 0,
}: {
	list: string;
	style?: StyleProp<ViewStyle>;
	scrollElRef?: ListRef;
	onScrolledDownChange: (isScrolledDown: boolean) => void;
	onPressTryAgain?: () => void;
	renderHeader: () => JSX.Element;
	renderEmptyState: () => JSX.Element;
	testID?: string;
	headerOffset?: number;
	desktopFixedHeightOffset?: number;
}) {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	const {
		data,
		isFetching,
		isFetched,
		isError,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useListMembersQuery(list);
	const isEmpty = !isFetching && !data?.pages[0]!.items.length;
	const isOwner = currentAccount && data?.pages[0]!.list.creator.did === currentAccount.did;

	let items: ListMemberItem[] = [];
	if (isFetched) {
		if (isEmpty && isError) {
			items = items.concat([ERROR_ITEM]);
		}
		if (isEmpty) {
			items = items.concat([EMPTY_ITEM]);
		} else if (data) {
			for (const page of data.pages) {
				items = items.concat(page.items);
			}
		}
		if (!isEmpty && isError) {
			items = items.concat([LOAD_MORE_ERROR_ITEM]);
		}
	} else if (isFetching) {
		items = items.concat([LOADING_ITEM]);
	}

	// events
	// =

	const onRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh lists', { message: err });
		}
		setIsRefreshing(false);
	};

	const onEndReached = async () => {
		if (isFetching || !hasNextPage || isError) return;
		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more lists', { message: err });
		}
	};

	const onPressRetryLoadMore = () => {
		void fetchNextPage();
	};

	// rendering
	// =

	const renderItem = ({ item }: { item: ListMemberItem }) => {
		if (isListMemberSentinel(item)) {
			if (item === ERROR_ITEM) {
				return <ErrorMessage message={cleanError(error)} onPressTryAgain={onPressTryAgain} />;
			}
			if (item === LOAD_MORE_ERROR_ITEM) {
				return (
					<LoadMoreRetryBtn
						label={m['screens.profileList.members.fetchError']()}
						onPress={onPressRetryLoadMore}
					/>
				);
			}
			if (item === LOADING_ITEM) {
				return <ProfileCardFeedLoadingPlaceholder />;
			}
			return renderEmptyState();
		}

		const profile = item.subject as AnyProfileView;
		if (!moderationOpts) return null;

		return <ListMember profile={profile} moderationOpts={moderationOpts} isOwner={isOwner} list={list} />;
	};

	const renderFooter = () => {
		if (isEmpty) return null;
		return (
			<ListFooter
				hasNextPage={hasNextPage}
				error={cleanError(error)}
				isFetchingNextPage={isFetchingNextPage}
				onRetry={fetchNextPage}
				height={180 + headerOffset}
			/>
		);
	};

	return (
		<View testID={testID} style={style}>
			<List
				testID={testID ? `${testID}-flatlist` : undefined}
				ref={scrollElRef}
				data={items}
				keyExtractor={(item) => (isListMemberSentinel(item) ? item._reactKey : item.subject.did)}
				renderItem={renderItem}
				ListHeaderComponent={!isEmpty ? renderHeader : undefined}
				ListFooterComponent={renderFooter}
				refreshing={isRefreshing}
				onRefresh={() => void onRefresh()}
				headerOffset={headerOffset}
				contentContainerStyle={{
					minHeight: Dimensions.get('window').height * 1.5,
				}}
				onScrolledDownChange={onScrolledDownChange}
				onEndReached={() => void onEndReached()}
				onEndReachedThreshold={0.6}
				removeClippedSubviews={true}
				desktopFixedHeight={true}
			/>
		</View>
	);
}

function ListMember({
	profile,
	moderationOpts,
	isOwner,
	list,
}: {
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
	isOwner?: boolean;
	list: string;
}) {
	const t = useTheme();
	const editMembershipDialogHandle = Dialog.useDialogHandle();

	return (
		<View style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}>
			<ProfileCard.Link profile={profile}>
				<ProfileCard.Outer>
					<ProfileCard.Header>
						<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
						<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
						{isOwner && (
							<Button
								testID={`user-${profile.handle}-editBtn`}
								label={m['common.action.edit']()}
								onPress={(e) => {
									e.preventDefault();
									editMembershipDialogHandle.open(null);
								}}
								size="small"
								variant="solid"
								color="secondary"
							>
								<ButtonText>{m['common.action.edit']()}</ButtonText>
							</Button>
						)}
					</ProfileCard.Header>

					<ProfileCard.Labels profile={profile} moderationOpts={moderationOpts} />

					<ProfileCard.Description profile={profile} />
				</ProfileCard.Outer>
			</ProfileCard.Link>

			<UserAddRemoveListsDialog
				handle={editMembershipDialogHandle}
				profile={profile}
				onChange={(type, changedList) => {
					if (type === 'remove' && changedList.uri === list) {
						editMembershipDialogHandle.close();
					}
				}}
			/>
		</View>
	);
}
