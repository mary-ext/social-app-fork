import type { ReactNode } from 'react';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { type FeedNotification, useNotificationFeedQuery } from '#/state/queries/notifications/feed';

import { List, type ListRef, type ListRenderItemInfo } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';

import BellIcon from '#/icons/central/Bell_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './NotificationFeed.css';
import { NotificationFeedItem } from './NotificationFeedItem';
import { NotificationFeedLoadingPlaceholder } from './NotificationFeedLoadingPlaceholder';

const NOTIFICATION_ITEM_HEIGHT_ESTIMATE = 120;

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
	const { data, error, fetchNextPage, isError, isFetchingNextPage, isPending, refetch } =
		useNotificationFeedQuery({
			enabled: enabled && !!moderationOpts,
			filter,
		});

	// check all pages because mentions can leave the first page empty.
	const notifications = data?.pages.flatMap((page) => page.items) ?? [];

	const renderItem = ({ item, index }: ListRenderItemInfo<FeedNotification>) => {
		return (
			<NotificationFeedItem
				highlightUnread={filter === 'all'}
				item={item}
				moderationOpts={moderationOpts!}
				hideTopBorder={index === 0}
			/>
		);
	};

	return (
		<List
			ref={scrollElRef}
			data={notifications}
			estimateHeight={NOTIFICATION_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item._reactKey}
			renderItem={renderItem}
			ListEmptyComponent={
				isError ? (
					<ListError hideBackButton message={cleanError(error)} onRetry={() => void refetch()} />
				) : isPending ? (
					<NotificationFeedLoadingPlaceholder />
				) : (
					<ListEmpty className={css.emptyState} icon={BellIcon} message={m['view.notifications.empty']()} />
				)
			}
			ListHeaderComponent={ListHeaderComponent}
			ListFooterComponent={
				notifications.length > 0 && (
					<ListTail.Frame>
						{isFetchingNextPage ? (
							<ListTail.Pending />
						) : isError ? (
							<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
						) : null}
					</ListTail.Frame>
				)
			}
			onEndReached={() => {
				if (isError) {
					return;
				}
				void fetchNextPage();
			}}
			onEndReachedThreshold={2}
			onScrolledDownChange={onScrolledDownChange}
		/>
	);
}
