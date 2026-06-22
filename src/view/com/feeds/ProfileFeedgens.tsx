import { useCallback, useMemo, useState } from 'react';
import {
	type ListRenderItemInfo,
	type StyleProp,
	useWindowDimensions,
	View,
	type ViewStyle,
} from 'react-native';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { cleanError } from '#/lib/strings/errors';

import { usePreferencesQuery } from '#/state/queries/preferences';
import { useProfileFeedgensQuery } from '#/state/queries/profile-feedgens';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { EmptyState } from '#/view/com/util/EmptyState';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { List } from '#/view/com/util/List';
import { FeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { atoms as a, useTheme } from '#/alf';

import * as FeedCard from '#/components/FeedCard';
import { HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon } from '#/components/icons/Hashtag';
import { ListFooter } from '#/components/Lists';

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
	enabled?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
}

export function ProfileFeedgens({ did, enabled, style, testID }: ProfileFeedgensProps) {
	const { t: l } = useLingui();
	const t = useTheme();
	const [isPTRing, setIsPTRing] = useState(false);
	const { height } = useWindowDimensions();
	const opts = useMemo(() => ({ enabled }), [enabled]);
	const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, isError, error, refetch } =
		useProfileFeedgensQuery(did, opts);
	const isEmpty = !isPending && !data?.pages[0]?.feeds.length;
	const { data: preferences } = usePreferencesQuery();
	const navigation = useNavigation();
	const { currentAccount } = useSession();
	const isSelf = currentAccount?.did === did;

	const items = useMemo(() => {
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
		return items;
	}, [isError, isEmpty, isPending, data]);

	// events
	// =

	const onRefresh = useCallback(async () => {
		setIsPTRing(true);
		try {
			await refetch();
		} catch (err) {
			logger.error('Failed to refresh feeds', { message: err });
		}
		setIsPTRing(false);
	}, [refetch, setIsPTRing]);

	const onEndReached = useCallback(async () => {
		if (isFetchingNextPage || !hasNextPage || isError) return;

		try {
			await fetchNextPage();
		} catch (err) {
			logger.error('Failed to load more feeds', { message: err });
		}
	}, [isFetchingNextPage, hasNextPage, isError, fetchNextPage]);

	const onPressRetryLoadMore = useCallback(() => {
		void fetchNextPage();
	}, [fetchNextPage]);

	// rendering
	// =

	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<FeedgenItem>) => {
			if (isFeedgenSentinel(item)) {
				if (item === ERROR_ITEM) {
					return <ErrorMessage message={cleanError(error)} onPressTryAgain={() => void refetch()} />;
				}
				if (item === LOAD_MORE_ERROR_ITEM) {
					return (
						<LoadMoreRetryBtn
							label={l`There was an issue fetching your lists. Tap here to try again.`}
							onPress={onPressRetryLoadMore}
						/>
					);
				}
				if (item === LOADING) {
					return <FeedLoadingPlaceholder />;
				}
				return (
					<EmptyState
						icon={HashtagWideIcon}
						message={isSelf ? l`You haven't made any custom feeds yet.` : l`No custom feeds yet`}
						messageColor="textContrastMedium"
						button={
							isSelf
								? {
										label: l`Browse custom feeds`,
										text: l`Browse custom feeds`,
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
				return (
					<View style={[a.border_t, t.atoms.border_contrast_low, a.px_lg, a.py_lg]}>
						<FeedCard.Default view={item} />
					</View>
				);
			}
			return null;
		},
		[l, t, error, refetch, onPressRetryLoadMore, preferences, navigation, isSelf],
	);

	const ProfileFeedgensFooter = useCallback(() => {
		if (isEmpty) return null;
		return (
			<ListFooter
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				onRetry={fetchNextPage}
				error={cleanError(error)}
				height={180}
			/>
		);
	}, [hasNextPage, error, isFetchingNextPage, fetchNextPage, isEmpty]);

	return (
		<View testID={testID} style={style}>
			<List
				testID={testID ? `${testID}-flatlist` : undefined}
				data={items}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				ListFooterComponent={ProfileFeedgensFooter}
				refreshing={isPTRing}
				onRefresh={() => void onRefresh()}
				progressViewOffset={undefined}
				removeClippedSubviews={true}
				desktopFixedHeight
				onEndReached={() => void onEndReached()}
				contentContainerStyle={{ minHeight: height }}
			/>
		</View>
	);
}

function keyExtractor(item: FeedgenItem) {
	return isFeedgenSentinel(item) ? item._reactKey : item.uri;
}
