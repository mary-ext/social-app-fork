import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { useNavigation } from '@react-navigation/native';

import { cleanError } from '#/lib/strings/errors';

import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileListsQuery } from '#/state/queries/profile-lists';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import * as ListCard from '#/components/ListCard';
import { ListFooter } from '#/components/Lists';

import { m } from '#/paraglide/messages';

// only governs rows that have never been on screen; the browser reuses the real size once rendered.
const LIST_ITEM_HEIGHT_ESTIMATE = 120;

const LOADING = { _reactKey: '__loading__' } as const;
const EMPTY = { _reactKey: '__empty__' } as const;
const ERROR_ITEM = { _reactKey: '__error__' } as const;
const LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' } as const;

type ProfileListItem =
	| AppBskyGraphDefs.ListView
	| typeof EMPTY
	| typeof ERROR_ITEM
	| typeof LOADING
	| typeof LOAD_MORE_ERROR_ITEM;
type ProfileListSentinel = Exclude<ProfileListItem, AppBskyGraphDefs.ListView>;

const isProfileListSentinel = (item: ProfileListItem): item is ProfileListSentinel => {
	return '_reactKey' in item;
};

interface ProfileListsProps {
	did: string;
	enabled?: boolean;
	/** Known list count, used to size the loading skeleton; falls back to a small default. */
	listCount?: number;
}

export function ProfileLists({ did, enabled, listCount }: ProfileListsProps): React.ReactNode {
	const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		useProfileListsQuery(did, { enabled });
	const isEmpty = !isPending && !data?.pages[0]?.lists.length;
	const { data: preferences } = usePreferencesQuery();
	const navigation = useNavigation();
	const { currentAccount } = useSession();
	const isSelf = currentAccount?.did === did;

	let items: ProfileListItem[] = [];
	if (isError && isEmpty) {
		items = items.concat([ERROR_ITEM]);
	}
	if (isPending) {
		items = items.concat([LOADING]);
	} else if (isEmpty) {
		items = items.concat([EMPTY]);
	} else if (data?.pages) {
		for (const page of data?.pages) {
			items = items.concat(page.lists);
		}
	} else if (isError && !isEmpty) {
		items = items.concat([LOAD_MORE_ERROR_ITEM]);
	}

	// events
	// =

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;

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

	const renderItem = ({ index, item }: ListRenderItemInfo<ProfileListItem>) => {
		if (isProfileListSentinel(item)) {
			if (item === ERROR_ITEM) {
				return <ErrorMessage message={cleanError(error)} onPressTryAgain={() => void refetch()} />;
			}
			if (item === LOAD_MORE_ERROR_ITEM) {
				return <LoadMoreRetryBtn label={m['common.error.fetchLists']()} onPress={onPressRetryLoadMore} />;
			}
			if (item === LOADING) {
				return <ListCard.LoadingPlaceholder count={listCount} />;
			}
			return (
				<EmptyState
					icon={ListIcon}
					message={isSelf ? m['view.lists.empty.none']() : m['view.lists.empty.title']()}
					messageColor="textContrastMedium"
					button={
						isSelf
							? {
									label: m['view.lists.action.create'](),
									text: m['view.lists.action.create'](),
									onPress: () => navigation.navigate('Lists' as never),
									size: 'small',
									color: 'primary',
								}
							: undefined
					}
				/>
			);
		}
		if (preferences) {
			// the first list card sits flush under the sticky tab bar; drop its top separator so the two
			// don't draw a doubled line.
			return <ListCard.Default view={item} topBorder={index !== 0} />;
		}
		return null;
	};

	return (
		<List
			data={items}
			estimateHeight={LIST_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			ListFooterComponent={
				isEmpty ? null : (
					<ListFooter
						hasNextPage={hasNextPage}
						isFetchingNextPage={isFetchingNextPage}
						onRetry={fetchNextPage}
						error={cleanError(error)}
						height={180}
					/>
				)
			}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={2}
		/>
	);
}

function keyExtractor(item: ProfileListItem) {
	return isProfileListSentinel(item) ? item._reactKey : item.uri;
}
