import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, LayoutAnimation, StyleSheet, View } from 'react-native';
import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';

import { DISCOVER_FEED_URI, KNOWN_SHUTDOWN_FEEDS } from '#/lib/constants';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { isNetworkError } from '#/lib/strings/errors';

import { usePostAuthorShadowFilter } from '#/state/cache/profile-shadow';
import { postCreated } from '#/state/events';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { STALE } from '#/state/queries';
import {
	type FeedDescriptor,
	type FeedPostSlice,
	type FeedPostSliceItem,
	pollLatest,
	RQKEY,
	usePostFeedQuery,
} from '#/state/queries/post-feed';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { PostFeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { SuggestedFollows } from '#/components/FeedInterstitials';
import { List, type ListRef, type ListRenderItemInfo } from '#/components/List/List';

import { ComposerPrompt } from '../feeds/ComposerPrompt';
import { FeedShutdownMsg } from './FeedShutdownMsg';
import { PostFeedErrorMessage } from './PostFeedErrorMessage';
import { PostFeedItem } from './PostFeedItem';
import { ShowLessFollowup } from './ShowLessFollowup';
import { ViewFullThread } from './ViewFullThread';

export type FeedRow =
	| {
			type: 'loading';
			key: string;
	  }
	| {
			type: 'empty';
			key: string;
	  }
	| {
			type: 'error';
			key: string;
	  }
	| {
			type: 'loadMoreError';
			key: string;
	  }
	| {
			type: 'feedShutdownMsg';
			key: string;
	  }
	| {
			type: 'sliceItem';
			key: string;
			slice: FeedPostSlice;
			indexInSlice: number;
			showReplyTo: boolean;
	  }
	| {
			type: 'sliceViewFullThread';
			key: string;
			uri: string;
	  }
	| {
			type: 'interstitialFollows';
			key: string;
	  }
	| {
			type: 'showLessFollowup';
			key: string;
	  }
	| {
			type: 'composerPrompt';
			key: string;
	  };

export function getItemsForFeedback(feedRow: FeedRow): {
	item: FeedPostSliceItem;
	feedContext: string | undefined;
	reqId: string | undefined;
}[] {
	if (feedRow.type === 'sliceItem') {
		// Report only the post this row actually rendered, not its unshown slice siblings.
		const item = feedRow.slice.items[feedRow.indexInSlice];
		if (!item) {
			return [];
		}
		return [{ feedContext: feedRow.slice.feedContext, item, reqId: feedRow.slice.reqId }];
	} else {
		return [];
	}
}

// DISABLED need to check if this is causing random feed refreshes -prf
// const REFRESH_AFTER = STALE.HOURS.ONE
const CHECK_LATEST_AFTER = STALE.SECONDS.THIRTY;

// Measured posts span ~120px (text) to ~700px (media), median ~240px.
const FEED_ITEM_HEIGHT_ESTIMATE = 300;

let PostFeed = ({
	feed,
	ignoreFilterFor,
	enabled,
	pollInterval,
	disablePoll,
	scrollElRef,
	onScrolledDownChange,
	onHasNew,
	renderEmptyState,
	renderEndOfFeed,
	testID,
	ListHeaderComponent,
	savedFeedConfig,
}: {
	feed: FeedDescriptor;
	ignoreFilterFor?: string;
	enabled?: boolean;
	pollInterval?: number;
	disablePoll?: boolean;
	scrollElRef?: ListRef;
	onHasNew?: (v: boolean) => void;
	onScrolledDownChange?: (isScrolledDown: boolean) => void;
	renderEmptyState: () => React.ReactElement;
	renderEndOfFeed?: () => React.ReactElement;
	testID?: string;
	ListHeaderComponent?: () => React.ReactElement;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
}): React.ReactNode => {
	const { t: l } = useLingui();
	const queryClient = useQueryClient();
	const { currentAccount, hasSession } = useSession();
	const feedFeedback = useFeedFeedbackContext();
	// eslint-disable-next-line react-hooks/purity
	const lastFetchRef = useRef<number>(Date.now());
	const [feedType, feedUriOrActorDid = '', feedTab] = feed.split('|');

	const [hasPressedShowLessUris, setHasPressedShowLessUris] = useState(() => new Set<string>());
	const onPressShowLess = useCallback((interaction: AppBskyFeedDefs.Interaction) => {
		if (interaction.item) {
			const uri = interaction.item;
			setHasPressedShowLessUris((prev) => new Set([...prev, uri]));
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		}
	}, []);

	const opts = useMemo(() => ({ enabled, ignoreFilterFor }), [enabled, ignoreFilterFor]);
	const {
		data,
		isFetching,
		isFetched,
		isError,
		error,
		refetch,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	} = usePostFeedQuery(feed, opts);
	const lastFetchedAt = data?.pages[0]?.fetchedAt;
	const isEmpty = useMemo(
		() => !isFetching && !data?.pages?.some((page) => page.slices.length),
		[isFetching, data],
	);

	useEffect(() => {
		if (lastFetchedAt) {
			lastFetchRef.current = lastFetchedAt;
		}
	}, [lastFetchedAt]);

	const checkForNew = useNonReactiveCallback(async () => {
		if (!data?.pages[0] || isFetching || !onHasNew || !enabled || disablePoll) {
			return;
		}

		// Discover always has fresh content
		if (feedUriOrActorDid === DISCOVER_FEED_URI) {
			return onHasNew(true);
		}

		try {
			if (await pollLatest(data.pages[0])) {
				if (isEmpty) {
					void refetch();
				} else {
					onHasNew(true);
				}
			}
		} catch (e) {
			if (!isNetworkError(e)) {
				logger.error('Poll latest failed', { feed, message: String(e) });
			}
		}
	});

	const isScrolledDownRef = useRef(false);
	const handleScrolledDownChange = (isScrolledDown: boolean) => {
		isScrolledDownRef.current = isScrolledDown;
		onScrolledDownChange?.(isScrolledDown);
	};

	const myDid = currentAccount?.did || '';
	const onPostCreated = useCallback(() => {
		// NOTE
		// only invalidate if at the top of the feed
		// changing content when scrolled can trigger some UI freakouts on iOS and android
		// -sfn
		if (
			!isScrolledDownRef.current &&
			(feed === 'following' || feed === `author|${myDid}|posts_and_author_threads`)
		) {
			void queryClient.invalidateQueries({ queryKey: RQKEY(feed) });
		}
	}, [queryClient, feed, myDid]);
	useEffect(() => {
		return postCreated.subscribe(onPostCreated);
	}, [onPostCreated]);

	useEffect(() => {
		if (enabled && !disablePoll) {
			const timeSinceFirstLoad = Date.now() - lastFetchRef.current;
			if (isEmpty || timeSinceFirstLoad > CHECK_LATEST_AFTER) {
				// check for new on enable (aka on focus)
				void checkForNew();
			}
		}
	}, [enabled, isEmpty, disablePoll, checkForNew]);

	useEffect(() => {
		let cleanup1: () => void | undefined, cleanup2: () => void | undefined;
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			// check for new on app foreground
			if (nextAppState === 'active') {
				void checkForNew();
			}
		});
		cleanup1 = () => subscription.remove();
		if (pollInterval) {
			// check for new on interval
			const i = setInterval(() => {
				void checkForNew();
			}, pollInterval);
			cleanup2 = () => clearInterval(i);
		}
		return () => {
			cleanup1?.();
			cleanup2?.();
		};
	}, [pollInterval, checkForNew]);

	const blockedOrMutedAuthors = usePostAuthorShadowFilter(
		// author feeds have their own handling
		feed.startsWith('author|') ? undefined : data?.pages,
	);

	const feedItems: FeedRow[] = useMemo(() => {
		// wraps a slice item, and replaces it with a showLessFollowup item
		// if the user has pressed show less on it
		const sliceItem = (row: Extract<FeedRow, { type: 'sliceItem' }>) => {
			const uri = row.slice.items[row.indexInSlice]?.uri;
			if (uri && hasPressedShowLessUris.has(uri)) {
				return {
					type: 'showLessFollowup',
					key: row.key,
				} as const;
			} else {
				return row;
			}
		};

		let feedKind: 'following' | 'discover' | 'profile' | undefined;
		if (feedType === 'following') {
			feedKind = 'following';
		} else if (feedUriOrActorDid === DISCOVER_FEED_URI) {
			feedKind = 'discover';
		} else if (
			feedType === 'author' &&
			(feedTab === 'posts_and_author_threads' || feedTab === 'posts_with_replies')
		) {
			feedKind = 'profile';
		}

		let arr: FeedRow[] = [];
		if (KNOWN_SHUTDOWN_FEEDS.includes(feedUriOrActorDid)) {
			arr.push({
				type: 'feedShutdownMsg',
				key: 'feedShutdownMsg',
			});
		}
		if (isFetched) {
			if (isError && isEmpty) {
				arr.push({
					type: 'error',
					key: 'error',
				});
			} else if (isEmpty) {
				arr.push({
					type: 'empty',
					key: 'empty',
				});
			} else if (data) {
				let sliceIndex = -1;

				for (const page of data?.pages) {
					for (const slice of page.slices) {
						sliceIndex++;

						if (hasSession) {
							if (feedKind === 'discover') {
								if (sliceIndex === 0) {
									// Show composer prompt for Discover and Following feeds
									if (hasSession && (feedUriOrActorDid === DISCOVER_FEED_URI || feed === 'following')) {
										arr.push({
											type: 'composerPrompt',
											key: 'composerPrompt-' + sliceIndex,
										});
									}
								} else if (sliceIndex === 30) {
									arr.push({
										type: 'interstitialFollows',
										key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
									});
								}
							} else if (feedKind === 'following') {
								if (sliceIndex === 0) {
									// Show composer prompt for Following feed
									if (hasSession) {
										arr.push({
											type: 'composerPrompt',
											key: 'composerPrompt-' + sliceIndex,
										});
									}
								}
							} else if (feedKind === 'profile') {
								if (sliceIndex === 5) {
									arr.push({
										type: 'interstitialFollows',
										key: 'interstitial-' + sliceIndex + '-' + lastFetchedAt,
									});
								}
							}
						}

						if (slice.items.some((item) => blockedOrMutedAuthors.includes(item.post.author.did))) {
							// skip
						} else if (slice.isIncompleteThread && slice.items.length >= 3) {
							const beforeLast = slice.items.length - 2;
							const last = slice.items.length - 1;
							arr.push(
								sliceItem({
									type: 'sliceItem',
									key: slice.items[0]!._reactKey,
									slice: slice,
									indexInSlice: 0,
									showReplyTo: false,
								}),
							);
							arr.push({
								type: 'sliceViewFullThread',
								key: slice._reactKey + '-viewFullThread',
								uri: slice.items[0]!.uri,
							});
							arr.push(
								sliceItem({
									type: 'sliceItem',
									key: slice.items[beforeLast]!._reactKey,
									slice: slice,
									indexInSlice: beforeLast,
									showReplyTo:
										slice.items[beforeLast]!.parentAuthor?.did !== slice.items[beforeLast]!.post.author.did,
								}),
							);
							arr.push(
								sliceItem({
									type: 'sliceItem',
									key: slice.items[last]!._reactKey,
									slice: slice,
									indexInSlice: last,
									showReplyTo: false,
								}),
							);
						} else {
							for (let i = 0; i < slice.items.length; i++) {
								const item = slice.items[i]!;
								arr.push(
									sliceItem({
										type: 'sliceItem',
										key: item._reactKey,
										slice: slice,
										indexInSlice: i,
										showReplyTo: i === 0,
									}),
								);
							}
						}
					}
				}
			}
			if (isError && !isEmpty) {
				arr.push({
					type: 'loadMoreError',
					key: 'loadMoreError',
				});
			}
		} else {
			arr.push({
				type: 'loading',
				key: 'loading',
			});
		}

		return arr;
	}, [
		isFetched,
		isError,
		isEmpty,
		lastFetchedAt,
		data,
		feed,
		feedType,
		feedUriOrActorDid,
		feedTab,
		hasSession,
		hasPressedShowLessUris,
		blockedOrMutedAuthors,
	]);

	// events
	// =

	const onEndReached = useCallback(async () => {
		if (isFetching || !hasNextPage || isError) return;

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more posts', { message: err });
		}
	}, [isFetching, hasNextPage, isError, fetchNextPage]);

	const onPressTryAgain = useCallback(() => {
		void refetch();
		onHasNew?.(false);
	}, [refetch, onHasNew]);

	const onPressRetryLoadMore = useCallback(() => {
		void fetchNextPage();
	}, [fetchNextPage]);

	// rendering
	// =

	const renderItem = useCallback(
		({ item: row, index: rowIndex }: ListRenderItemInfo<FeedRow>) => {
			if (row.type === 'empty') {
				return renderEmptyState();
			} else if (row.type === 'error') {
				return (
					<PostFeedErrorMessage
						feedDesc={feed}
						error={error ?? undefined}
						onPressTryAgain={onPressTryAgain}
						savedFeedConfig={savedFeedConfig}
					/>
				);
			} else if (row.type === 'loadMoreError') {
				return (
					<LoadMoreRetryBtn
						label={l`There was an issue fetching posts. Tap here to try again.`}
						onPress={onPressRetryLoadMore}
					/>
				);
			} else if (row.type === 'loading') {
				return <PostFeedLoadingPlaceholder />;
			} else if (row.type === 'feedShutdownMsg') {
				return <FeedShutdownMsg feedUri={feedUriOrActorDid} />;
			} else if (row.type === 'interstitialFollows') {
				return <SuggestedFollows feed={feed} />;
			} else if (row.type === 'composerPrompt') {
				return <ComposerPrompt />;
			} else if (row.type === 'sliceItem') {
				const slice = row.slice;
				const indexInSlice = row.indexInSlice;
				const item = slice.items[indexInSlice]!;
				return (
					<PostFeedItem
						post={item.post}
						record={item.record}
						reason={indexInSlice === 0 ? slice.reason : undefined}
						feedContext={slice.feedContext}
						reqId={slice.reqId}
						moderation={item.moderation}
						parentAuthor={item.parentAuthor}
						showReplyTo={row.showReplyTo}
						isThreadParent={isThreadParentAt(slice.items, indexInSlice)}
						isThreadChild={isThreadChildAt(slice.items, indexInSlice)}
						isThreadLastChild={
							isThreadChildAt(slice.items, indexInSlice) && slice.items.length === indexInSlice + 1
						}
						isParentBlocked={item.isParentBlocked}
						isParentNotFound={item.isParentNotFound}
						hideTopBorder={rowIndex === 0 && indexInSlice === 0}
						rootPost={slice.items[0]!.post}
						onShowLess={onPressShowLess}
					/>
				);
			} else if (row.type === 'sliceViewFullThread') {
				return <ViewFullThread uri={row.uri} />;
			} else if (row.type === 'showLessFollowup') {
				return <ShowLessFollowup />;
			} else {
				return null;
			}
		},
		[
			renderEmptyState,
			feed,
			error,
			onPressTryAgain,
			savedFeedConfig,
			l,
			onPressRetryLoadMore,
			feedUriOrActorDid,
			onPressShowLess,
		],
	);

	const shouldRenderEndOfFeed = !hasNextPage && !isEmpty && !isFetching && !isError && !!renderEndOfFeed;
	// A bit of padding at the bottom of the feed as you scroll and when you reach the end, so that
	// content isn't cut off by the bottom of the screen.
	const offset = 32;
	const feedFooter = isFetchingNextPage ? (
		<View style={[styles.feedFooter]}>
			<ActivityIndicator />
			<View style={{ height: offset }} />
		</View>
	) : shouldRenderEndOfFeed ? (
		<View style={{ minHeight: offset }}>{renderEndOfFeed()}</View>
	) : (
		<View style={{ height: offset }} />
	);

	const onItemSeen = useCallback(
		(item: FeedRow) => {
			feedFeedback.onItemSeen(item);
		},
		[feedFeedback],
	);

	return (
		<View testID={testID}>
			<List
				ref={scrollElRef}
				data={feedItems}
				keyExtractor={(item: FeedRow) => item.key}
				estimateHeight={FEED_ITEM_HEIGHT_ESTIMATE}
				renderItem={renderItem}
				ListFooterComponent={feedFooter}
				ListHeaderComponent={ListHeaderComponent && <ListHeaderComponent />}
				onScrolledDownChange={handleScrolledDownChange}
				onEndReached={() => void onEndReached()}
				onEndReachedThreshold={2}
				onItemSeen={onItemSeen}
			/>
		</View>
	);
};
PostFeed = memo(PostFeed);
export { PostFeed };

const styles = StyleSheet.create({
	feedFooter: { paddingTop: 20 },
});

export function isThreadParentAt<T>(arr: Array<T>, i: number) {
	if (arr.length === 1) {
		return false;
	}
	return i < arr.length - 1;
}

export function isThreadChildAt<T>(arr: Array<T>, i: number) {
	if (arr.length === 1) {
		return false;
	}
	return i > 0;
}
