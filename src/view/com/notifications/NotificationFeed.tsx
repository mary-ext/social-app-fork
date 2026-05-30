import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, type ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { type AppBskyFeedDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import { cleanError } from '#/lib/strings/errors';
import { s } from '#/lib/styles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { type FeedNotification } from '#/state/queries/notifications/feed';
import { useNotificationFeedQuery } from '#/state/queries/notifications/feed';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { List, type ListProps, type ListRef } from '#/view/com/util/List';
import { NotificationFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { Bell_Stroke2_Corner0_Rounded as BellIcon } from '#/components/icons/Bell';

import { NotificationFeedItem } from './NotificationFeedItem';

const EMPTY_FEED_ITEM = { _reactKey: '__empty__' } as const;
const LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' } as const;
const LOADING_ITEM = { _reactKey: '__loading__' } as const;

type NotificationItem =
	| FeedNotification
	| typeof EMPTY_FEED_ITEM
	| typeof LOAD_MORE_ERROR_ITEM
	| typeof LOADING_ITEM;
type NotificationSentinel = Exclude<NotificationItem, FeedNotification>;

const isNotificationSentinel = (item: NotificationItem): item is NotificationSentinel => {
	return item === EMPTY_FEED_ITEM || item === LOAD_MORE_ERROR_ITEM || item === LOADING_ITEM;
};

export function NotificationFeed({
	filter,
	enabled,
	scrollElRef,
	onPressTryAgain,
	onScrolledDownChange,
	ListHeaderComponent,
	refreshNotifications,
}: {
	filter: 'all' | 'mentions';
	enabled: boolean;
	scrollElRef?: ListRef;
	onPressTryAgain?: () => void;
	onScrolledDownChange: (isScrolledDown: boolean) => void;
	ListHeaderComponent?: ListProps['ListHeaderComponent'];
	refreshNotifications: () => Promise<void>;
}) {
	const initialNumToRender = useInitialNumToRender();
	const [isPTRing, setIsPTRing] = useState(false);
	const { t: l } = useLingui();
	const moderationOpts = useModerationOpts();
	const trackPostView = usePostViewTracking('Notifications');
	const { data, isFetching, isFetched, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
		useNotificationFeedQuery({
			enabled: enabled && !!moderationOpts,
			filter,
		});
	// previously, this was `!isFetching && !data?.pages[0]?.items.length`
	// however, if the first page had no items (can happen in the mentions tab!)
	// it would flicker the empty state whenever it was loading.
	// therefore, we need to find if *any* page has items. in 99.9% of cases,
	// the `.find()` won't need to go any further than the first page -sfn
	const isEmpty = !isFetching && !data?.pages.find((page) => page.items.length > 0);

	const items = useMemo(() => {
		let arr: NotificationItem[] = [];
		if (isFetched) {
			if (isEmpty) {
				arr = arr.concat([EMPTY_FEED_ITEM]);
			} else if (data) {
				for (const page of data?.pages) {
					arr = arr.concat(page.items);
				}
			}
			if (isError && !isEmpty) {
				arr = arr.concat([LOAD_MORE_ERROR_ITEM]);
			}
		} else {
			arr.push(LOADING_ITEM);
		}
		return arr;
	}, [isFetched, isError, isEmpty, data]);

	const onRefresh = useCallback(async () => {
		try {
			setIsPTRing(true);
			await refreshNotifications();
		} catch (err) {
			logger.error('Failed to refresh notifications feed', {
				message: err,
			});
		} finally {
			setIsPTRing(false);
		}
	}, [refreshNotifications, setIsPTRing]);

	const onEndReached = useCallback(async () => {
		if (isFetching || !hasNextPage || isError) return;

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more notifications', { message: err });
		}
	}, [isFetching, hasNextPage, isError, fetchNextPage]);

	const onPressRetryLoadMore = useCallback(() => {
		fetchNextPage();
	}, [fetchNextPage]);

	const renderItem = useCallback(
		({ item, index }: ListRenderItemInfo<NotificationItem>) => {
			if (isNotificationSentinel(item)) {
				if (item === LOAD_MORE_ERROR_ITEM) {
					return (
						<LoadMoreRetryBtn
							label={l`There was an issue fetching notifications. Tap here to try again.`}
							onPress={onPressRetryLoadMore}
						/>
					);
				}
				if (item === LOADING_ITEM) {
					return <NotificationFeedLoadingPlaceholder />;
				}
				return <EmptyState icon={BellIcon} message={l`No notifications yet!`} style={styles.emptyState} />;
			}
			return (
				<NotificationFeedItem
					highlightUnread={filter === 'all'}
					item={item}
					moderationOpts={moderationOpts!}
					hideTopBorder={index === 0}
				/>
			);
		},
		[moderationOpts, l, onPressRetryLoadMore, filter],
	);

	const FeedFooter = useCallback(
		() =>
			isFetchingNextPage ? (
				<View style={styles.feedFooter}>
					<ActivityIndicator />
				</View>
			) : (
				<View />
			),
		[isFetchingNextPage],
	);

	useEffect(() => {
		if (!enabled) {
			setIsPTRing(false);
		}
	}, [enabled]);

	return (
		<View style={s.hContentRegion}>
			{error && <ErrorMessage message={cleanError(error)} onPressTryAgain={onPressTryAgain} />}
			<List
				testID="notifsFeed"
				ref={scrollElRef}
				data={items}
				keyExtractor={(item) => item._reactKey}
				renderItem={renderItem}
				ListHeaderComponent={ListHeaderComponent}
				ListFooterComponent={FeedFooter}
				refreshing={isPTRing}
				onRefresh={onRefresh}
				onEndReached={onEndReached}
				onEndReachedThreshold={2}
				onScrolledDownChange={onScrolledDownChange}
				onItemSeen={(item) => {
					if (isNotificationSentinel(item)) {
						return;
					}
					if ((item.type === 'reply' || item.type === 'mention' || item.type === 'quote') && item.subject) {
						// TODO(atcute Phase 2.6): drop cast once notification feed flips to @atcute
						trackPostView(item.subject as unknown as AppBskyFeedDefs.PostView);
					}
				}}
				contentContainerStyle={s.contentContainer}
				desktopFixedHeight
				initialNumToRender={initialNumToRender}
				windowSize={11}
				sideBorders={false}
				removeClippedSubviews={true}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	feedFooter: { paddingTop: 20 },
	emptyState: { paddingVertical: 40 },
});
