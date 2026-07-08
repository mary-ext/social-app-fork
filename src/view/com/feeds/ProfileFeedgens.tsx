import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { useNavigation } from '@react-navigation/native';

import { cleanError } from '#/lib/strings/errors';

import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileFeedgensQuery } from '#/state/queries/profile-feedgens';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import * as FeedCard from '#/components/FeedCard';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';

import { m } from '#/paraglide/messages';

// only governs rows that have never been on screen; the browser reuses the real size once rendered.
const FEEDGEN_ITEM_HEIGHT_ESTIMATE = 120;

const LOADING = { _reactKey: '__loading__' } as const;
const EMPTY = { _reactKey: '__empty__' } as const;
const ERROR_ITEM = { _reactKey: '__error__' } as const;
const LOAD_MORE_ERROR_ITEM = { _reactKey: '__load_more_error__' } as const;

type FeedgenItem =
	| AppBskyFeedDefs.GeneratorView
	| typeof EMPTY
	| typeof ERROR_ITEM
	| typeof LOADING
	| typeof LOAD_MORE_ERROR_ITEM;
type FeedgenSentinel = Exclude<FeedgenItem, AppBskyFeedDefs.GeneratorView>;

const isFeedgenSentinel = (item: FeedgenItem): item is FeedgenSentinel => {
	return '_reactKey' in item;
};

interface ProfileFeedgensProps {
	did: string;
	/** Known feed-generator count, used to size the loading skeleton; falls back to a small default. */
	feedCount?: number;
}

export function ProfileFeedgens({ did, feedCount }: ProfileFeedgensProps): React.ReactNode {
	const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		useProfileFeedgensQuery(did);
	const isEmpty = !isPending && !data?.pages[0]?.feeds.length;
	const { data: preferences } = usePreferencesQuery();
	const navigation = useNavigation();
	const { currentAccount } = useSession();
	const isSelf = currentAccount?.did === did;

	let items: FeedgenItem[] = [];
	if (isError && isEmpty) {
		items = items.concat([ERROR_ITEM]);
	}
	if (isPending) {
		items = items.concat([LOADING]);
	} else if (isEmpty) {
		items = items.concat([EMPTY]);
	} else if (data?.pages) {
		for (const page of data?.pages) {
			items = items.concat(page.feeds);
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
			logger.error('Failed to load more feeds', { message: err });
		}
	};

	const onPressRetryLoadMore = () => {
		void fetchNextPage();
	};

	// rendering
	// =

	const renderItem = ({ index, item }: ListRenderItemInfo<FeedgenItem>) => {
		if (isFeedgenSentinel(item)) {
			if (item === ERROR_ITEM) {
				return <ErrorMessage message={cleanError(error)} onPressTryAgain={() => void refetch()} />;
			}
			if (item === LOAD_MORE_ERROR_ITEM) {
				return <LoadMoreRetryBtn label={m['common.list.fetchError']()} onPress={onPressRetryLoadMore} />;
			}
			if (item === LOADING) {
				return <FeedCard.LoadingPlaceholder count={feedCount} />;
			}
			return (
				<EmptyState
					icon={HashtagWideIcon}
					message={isSelf ? m['view.feeds.saved.empty.message']() : m['view.feeds.saved.empty.title']()}
					messageColor="textContrastMedium"
					button={
						isSelf
							? {
									label: m['view.feeds.discover.browse'](),
									text: m['view.feeds.discover.browse'](),
									onPress: () => navigation.navigate('Feeds' as never),
									size: 'small',
									color: 'secondary',
								}
							: undefined
					}
				/>
			);
		}
		if (preferences) {
			// the first feed card sits flush under the sticky tab bar; drop its top separator so the two
			// don't draw a doubled line.
			return <FeedCard.Default view={item} topBorder={index !== 0} />;
		}
		return null;
	};

	return (
		<List
			data={items}
			estimateHeight={FEEDGEN_ITEM_HEIGHT_ESTIMATE}
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

function keyExtractor(item: FeedgenItem) {
	return isFeedgenSentinel(item) ? item._reactKey : item.uri;
}
