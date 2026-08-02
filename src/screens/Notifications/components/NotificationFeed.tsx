import type { ReactNode } from 'react';

import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { type FeedNotification, useNotificationFeedQuery } from '#/state/queries/notifications/feed';

import { EmptyState } from '#/components/EmptyState';
import { ErrorMessage } from '#/components/ErrorMessage';
import { List, type ListRef, type ListRenderItemInfo } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';

import BellIcon from '#/icons/central/Bell_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './NotificationFeed.css';
import { NotificationFeedItem } from './NotificationFeedItem';
import { NotificationFeedLoadingPlaceholder } from './NotificationFeedLoadingPlaceholder';

const NOTIFICATION_ITEM_HEIGHT_ESTIMATE = 120;

const EMPTY_FEED_ITEM = { _reactKey: '__empty__' } as const;
const LOADING_ITEM = { _reactKey: '__loading__' } as const;

type NotificationItem = FeedNotification | typeof EMPTY_FEED_ITEM | typeof LOADING_ITEM;
type NotificationSentinel = Exclude<NotificationItem, FeedNotification>;

const isNotificationSentinel = (item: NotificationItem): item is NotificationSentinel => {
	return item === EMPTY_FEED_ITEM || item === LOADING_ITEM;
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
	// check all pages because mentions can leave the first page empty.
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
	} else {
		items.push(LOADING_ITEM);
	}

	const onEndReached = () => {
		if (isFetching || !hasNextPage || isError) {
			return;
		}

		void fetchNextPage();
	};

	const onPressRetryLoadMore = () => fetchNextPage();

	const renderItem = ({ item, index }: ListRenderItemInfo<NotificationItem>) => {
		if (isNotificationSentinel(item)) {
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

	const feedFooter = (
		<ListFooter
			isFetchingNextPage={isFetchingNextPage}
			error={isError && !isEmpty ? cleanError(error) : undefined}
			onRetry={onPressRetryLoadMore}
			hasNextPage={hasNextPage}
		/>
	);

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
				onEndReached={onEndReached}
				onEndReachedThreshold={2}
				onScrolledDownChange={onScrolledDownChange}
			/>
		</>
	);
}
