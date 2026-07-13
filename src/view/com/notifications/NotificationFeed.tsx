import type { ReactNode } from 'react';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { type FeedNotification, useNotificationFeedQuery } from '#/state/queries/notifications/feed';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { Bell_Stroke2_Corner0_Rounded as BellIcon } from '#/components/icons/Bell';
import { List, type ListRef, type ListRenderItemInfo } from '#/components/List/List';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as css from './NotificationFeed.css';
import { NotificationFeedItem } from './NotificationFeedItem';
import { NotificationFeedLoadingPlaceholder } from './NotificationFeedLoadingPlaceholder';

const NOTIFICATION_ITEM_HEIGHT_ESTIMATE = 120;

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
	onScrolledDownChange,
	ListHeaderComponent,
}: {
	filter: 'all' | 'mentions';
	enabled: boolean;
	scrollElRef?: ListRef;
	onScrolledDownChange: (isScrolledDown: boolean) => void;
	ListHeaderComponent?: ReactNode;
}) {
	const moderationOpts = useModerationOpts();
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

	let items: NotificationItem[] = [];
	if (isFetched) {
		if (isEmpty) {
			items = items.concat([EMPTY_FEED_ITEM]);
		} else if (data) {
			for (const page of data.pages) {
				items = items.concat(page.items);
			}
		}
		if (isError && !isEmpty) {
			items = items.concat([LOAD_MORE_ERROR_ITEM]);
		}
	} else {
		items.push(LOADING_ITEM);
	}

	const onEndReached = async () => {
		if (isFetching || !hasNextPage || isError) return;

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more notifications', { message: err });
		}
	};

	const onPressRetryLoadMore = () => {
		void fetchNextPage();
	};

	const renderItem = ({ item, index }: ListRenderItemInfo<NotificationItem>) => {
		if (isNotificationSentinel(item)) {
			if (item === LOAD_MORE_ERROR_ITEM) {
				return (
					<LoadMoreRetryBtn label={m['view.notifications.fetchError']()} onPress={onPressRetryLoadMore} />
				);
			}
			if (item === LOADING_ITEM) {
				return <NotificationFeedLoadingPlaceholder />;
			}
			return (
				<EmptyState icon={BellIcon} message={m['view.notifications.empty']()} className={css.emptyState} />
			);
		}
		return (
			<NotificationFeedItem
				highlightUnread={filter === 'all'}
				item={item}
				moderationOpts={moderationOpts!}
				hideTopBorder={index === 0}
			/>
		);
	};

	const feedFooter = isFetchingNextPage ? (
		<div className={css.feedFooter}>
			<Spinner color="default" label={m['common.status.loading']()} />
		</div>
	) : null;

	return (
		<>
			{error && <ErrorMessage message={cleanError(error)} />}
			<List
				ref={scrollElRef}
				data={items}
				estimateHeight={NOTIFICATION_ITEM_HEIGHT_ESTIMATE}
				keyExtractor={(item) => item._reactKey}
				renderItem={renderItem}
				ListHeaderComponent={ListHeaderComponent}
				ListFooterComponent={feedFooter}
				onEndReached={() => void onEndReached()}
				onEndReachedThreshold={2}
				onScrolledDownChange={onScrolledDownChange}
			/>
		</>
	);
}
