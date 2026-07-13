import { type ComponentType, useMemo, useRef, useState } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';

import debounce from 'lodash.debounce';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { cleanError } from '#/lib/strings/errors';

import {
	type SavedFeedItem,
	useGetPopularFeedsQuery,
	useSavedFeeds,
	useSearchPopularFeedsMutation,
} from '#/state/queries/feed';
import { useSession } from '#/state/session';

import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import { FAB } from '#/view/com/util/fab/FAB';

import { NoFollowingFeed } from '#/screens/Feeds/NoFollowingFeed';
import { NoSavedFeedsOfAnyType } from '#/screens/Feeds/NoSavedFeedsOfAnyType';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as FeedCard from '#/components/FeedCard';
import { SearchInput } from '#/components/forms/SearchInput';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '#/components/icons/Chevron';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import { FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline } from '#/components/icons/FilterTimeline';
import { ListMagnifyingGlass_Stroke2_Corner0_Rounded as ListMagnifyingGlassIcon } from '#/components/icons/ListMagnifyingGlass';
import { ListSparkle_Stroke2_Corner0_Rounded as ListSparkleIcon } from '#/components/icons/ListSparkle';
import { SettingsGear2_Stroke2_Corner0_Rounded as Gear } from '#/components/icons/SettingsGear2';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import * as ListCard from '#/components/ListCard';
import { Text } from '#/components/Text';
import { ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './Feeds.css';

// rough per-row height for the off-screen render-skipping estimate; the browser reuses each row's real size once
// rendered, so it only governs rows that have never been on screen.
const FEED_ITEM_HEIGHT_ESTIMATE = 120;
// placeholder rows to show while the discover/search section loads (its real count isn't known ahead of time).
const POPULAR_FEEDS_LOADING_COUNT = 6;

type FlatlistSlice =
	| {
			type: 'error';
			key: string;
			error: string;
	  }
	| {
			type: 'savedFeedsHeader';
			key: string;
	  }
	| {
			type: 'savedFeedPlaceholder';
			key: string;
	  }
	| {
			type: 'savedFeedNoResults';
			key: string;
	  }
	| {
			type: 'savedFeed';
			key: string;
			savedFeed: SavedFeedItem;
	  }
	| {
			type: 'popularFeedsHeader';
			key: string;
	  }
	| {
			type: 'popularFeedsLoading';
			key: string;
	  }
	| {
			type: 'popularFeedsNoResults';
			key: string;
	  }
	| {
			type: 'popularFeed';
			key: string;
			feed: AppBskyFeedDefs.GeneratorView;
	  }
	| {
			type: 'noFollowingFeed';
			key: string;
	  };

export function FeedsScreen() {
	const { openComposer } = useOpenComposer();
	const { hasSession } = useSession();
	const [query, setQuery] = useState('');
	const {
		data: savedFeeds,
		isPlaceholderData: isSavedFeedsPlaceholder,
		error: savedFeedsError,
	} = useSavedFeeds();
	const {
		data: popularFeeds,
		error: popularFeedsError,
		fetchNextPage: fetchNextPopularFeedsPage,
		hasNextPage: hasNextPopularFeedsPage,
		isFetching: isPopularFeedsFetching,
		isFetchingNextPage: isPopularFeedsFetchingNextPage,
		refetch: refetchPopularFeeds,
	} = useGetPopularFeedsQuery();
	const {
		data: searchResults,
		error: searchError,
		isPending: isSearchPending,
		mutate: search,
		reset: resetSearch,
	} = useSearchPopularFeedsMutation();

	const searchAnchorRef = useRef<HTMLDivElement>(null);

	/** A search query is present. We may not have search results yet. */
	const isUserSearching = query.length > 1;
	const debouncedSearch = useMemo(() => debounce((q: string) => search(q), 500), [search]);

	const onChangeQuery = (text: string) => {
		setQuery(text);
		if (text.length > 1) {
			debouncedSearch(text);
		} else {
			void refetchPopularFeeds();
			resetSearch();
		}
	};
	const onPressCancelSearch = () => {
		setQuery('');
		void refetchPopularFeeds();
		resetSearch();
	};
	const onEndReached = () => {
		if (isPopularFeedsFetching || isUserSearching || !hasNextPopularFeedsPage || popularFeedsError) {
			return;
		}
		void fetchNextPopularFeedsPage();
	};
	// pull the search field up to the top of the viewport on focus so its results aren't buried below the fold.
	const onFocusSearch = () => {
		searchAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	let items: FlatlistSlice[] = [];
	{
		const hasActualSavedCount =
			!isSavedFeedsPlaceholder || (isSavedFeedsPlaceholder && (savedFeeds?.count || 0) > 0);
		const canShowDiscoverSection = !hasSession || (hasSession && hasActualSavedCount);

		if (hasSession) {
			items.push({ key: 'savedFeedsHeader', type: 'savedFeedsHeader' });

			if (savedFeedsError) {
				items.push({
					error: cleanError(savedFeedsError.toString()),
					key: 'savedFeedsError',
					type: 'error',
				});
			} else if (isSavedFeedsPlaceholder && !savedFeeds?.feeds.length) {
				/*
				 * Initial render in placeholder state is 0 on a cold page load, because preferences haven't loaded
				 * yet. In practice, `savedFeeds` is always defined, but we check for TS and for safety. In both
				 * cases, we show 8 as the loading state.
				 */
				const min = 8;
				const count = savedFeeds ? (savedFeeds.count === 0 ? min : savedFeeds.count) : min;
				for (let i = 0; i < count; i++) {
					items.push({ key: 'savedFeedPlaceholder' + i, type: 'savedFeedPlaceholder' });
				}
			} else if (savedFeeds?.feeds?.length) {
				const noFollowingFeed = savedFeeds.feeds.every((f) => f.type !== 'timeline');

				items = items.concat(
					savedFeeds.feeds
						.filter((s) => s.config.pinned)
						.map((s) => ({
							key: `savedFeed:${s.view?.uri}:${s.config.id}`,
							savedFeed: s,
							type: 'savedFeed',
						})),
				);
				items = items.concat(
					savedFeeds.feeds
						.filter((s) => !s.config.pinned)
						.map((s) => ({
							key: `savedFeed:${s.view?.uri}:${s.config.id}`,
							savedFeed: s,
							type: 'savedFeed',
						})),
				);

				if (noFollowingFeed) {
					items.push({ key: 'noFollowingFeed', type: 'noFollowingFeed' });
				}
			} else {
				items.push({ key: 'savedFeedNoResults', type: 'savedFeedNoResults' });
			}
		}

		if (canShowDiscoverSection) {
			items.push({ key: 'popularFeedsHeader', type: 'popularFeedsHeader' });

			if (popularFeedsError || searchError) {
				items.push({
					error: cleanError(popularFeedsError?.toString() ?? searchError?.toString() ?? ''),
					key: 'popularFeedsError',
					type: 'error',
				});
			} else if (isUserSearching) {
				if (isSearchPending || !searchResults) {
					items.push({ key: 'popularFeedsLoading', type: 'popularFeedsLoading' });
				} else if (searchResults.length === 0) {
					items.push({ key: 'popularFeedsNoResults', type: 'popularFeedsNoResults' });
				} else {
					items = items.concat(
						searchResults.map((feed) => ({
							feed,
							key: `popularFeed:${feed.uri}`,
							type: 'popularFeed',
						})),
					);
				}
			} else if (isPopularFeedsFetching && !popularFeeds?.pages) {
				items.push({ key: 'popularFeedsLoading', type: 'popularFeedsLoading' });
			} else if (!popularFeeds?.pages) {
				items.push({ key: 'popularFeedsNoResults', type: 'popularFeedsNoResults' });
			} else {
				for (const page of popularFeeds.pages) {
					items = items.concat(
						page.feeds.map((feed) => ({
							feed,
							key: `popularFeed:${feed.uri}`,
							type: 'popularFeed',
						})),
					);
				}
			}
		}
	}

	// the first popular feed sits directly beneath the search field, so it drops its top separator.
	const firstPopularFeedIndex = items.findIndex((item) => item.type === 'popularFeed');

	const renderItem = ({ index, item }: ListRenderItemInfo<FlatlistSlice>) => {
		switch (item.type) {
			case 'error':
				return <ErrorMessage message={item.error} />;
			case 'savedFeedsHeader':
				return (
					<SectionHeader
						bottomBorder
						first={index === 0}
						icon={ListSparkleIcon}
						title={m['view.feeds.saved.title']()}
					/>
				);
			case 'savedFeedNoResults':
				return (
					<div className={css.borderedSection}>
						<NoSavedFeedsOfAnyType />
					</div>
				);
			case 'savedFeedPlaceholder':
				return <SavedFeedPlaceholder />;
			case 'savedFeed':
				return <FeedOrFollowing savedFeed={item.savedFeed} />;
			case 'popularFeedsHeader':
				return (
					<>
						<SectionHeader
							first={index === 0}
							icon={ListMagnifyingGlassIcon}
							title={m['view.feeds.discover.title']()}
						/>
						<div ref={searchAnchorRef} className={css.searchWrapper}>
							<SearchInput
								label={m['view.feeds.search.placeholder']()}
								onChangeText={onChangeQuery}
								onClear={onPressCancelSearch}
								onFocus={onFocusSearch}
								placeholder={m['view.feeds.search.placeholder']()}
								value={query}
							/>
						</div>
					</>
				);
			case 'popularFeedsLoading':
				return <FeedCard.LoadingPlaceholder count={POPULAR_FEEDS_LOADING_COUNT} />;
			case 'popularFeed':
				return <FeedCard.Default topBorder={index !== firstPopularFeedIndex} view={item.feed} />;
			case 'popularFeedsNoResults':
				return (
					<div className={css.noResults}>
						<Text color="textContrastMedium" size="lg">
							{m['view.feeds.discover.empty']({ query })}
						</Text>
					</div>
				);
			case 'noFollowingFeed':
				return (
					<div className={css.borderedSection}>
						<NoFollowingFeed />
					</div>
				);
		}
	};

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.feeds']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot>
					<LinkButton
						color="secondary"
						label={m['common.feeds.action.edit']()}
						shape="round"
						size="small"
						to="/settings/saved-feeds"
						variant="ghost"
					>
						<ButtonIcon icon={Gear} size="lg" />
					</LinkButton>
				</Layout.Header.Slot>
			</Layout.Header.Outer>
			<List
				data={items}
				estimateHeight={FEED_ITEM_HEIGHT_ESTIMATE}
				keyExtractor={(item) => item.key}
				ListFooterComponent={
					isPopularFeedsFetchingNextPage ? (
						<CenteredSpinner label={m['view.feeds.feed.loadingMore']()} size="2xl" />
					) : null
				}
				onEndReached={onEndReached}
				onEndReachedThreshold={2}
				renderItem={renderItem}
			/>
			{hasSession && (
				<FAB
					icon={<EditBigIcon size="xl" fill={colors.white} />}
					label={m['common.compose.action.new']()}
					onClick={() => openComposer({})}
				/>
			)}
		</Layout.Screen>
	);
}

function FeedOrFollowing({ savedFeed }: { savedFeed: SavedFeedItem }) {
	return savedFeed.type === 'timeline' ? <FollowingFeed /> : <SavedFeed savedFeed={savedFeed} />;
}

function FollowingFeed() {
	return (
		<div className={css.plainRow}>
			<FeedCard.Header>
				<div className={css.followingIcon}>
					<FilterTimeline size="md" fill={colors.white} />
				</div>
				<FeedCard.TitleAndByline title={m['common.feeds.following']()} />
			</FeedCard.Header>
		</div>
	);
}

function SavedFeed({ savedFeed }: { savedFeed: SavedFeedItem & { type: 'feed' | 'list' } }) {
	return savedFeed.type === 'feed' ? (
		<FeedCard.Link className={css.savedFeedRow} view={savedFeed.view}>
			<FeedCard.Header>
				<FeedCard.Avatar size={28} src={savedFeed.view.avatar} />
				<FeedCard.TitleAndByline title={savedFeed.view.displayName} />
				<ChevronRight size="sm" fill={colors.textContrastLow} />
			</FeedCard.Header>
		</FeedCard.Link>
	) : (
		<ListCard.Link className={css.savedFeedRow} view={savedFeed.view}>
			<ListCard.Header>
				<ListCard.Avatar size={28} src={savedFeed.view.avatar} />
				<ListCard.TitleAndByline title={savedFeed.view.name} />
				<ChevronRight size="sm" fill={colors.textContrastLow} />
			</ListCard.Header>
		</ListCard.Link>
	);
}

function SavedFeedPlaceholder() {
	return (
		<div className={css.plainRow}>
			<FeedCard.Header>
				<FeedCard.AvatarPlaceholder size={28} />
				<FeedCard.TitleAndBylinePlaceholder />
			</FeedCard.Header>
		</div>
	);
}

function SectionHeader({
	bottomBorder,
	first,
	icon: Icon,
	title,
}: {
	bottomBorder?: boolean;
	first?: boolean;
	icon: ComponentType<SVGIconProps>;
	title: string;
}) {
	return (
		<div className={css.sectionHeader({ bottomBorder, first })}>
			<Icon className={css.sectionHeaderIcon} size="lg" />
			<Text className={css.sectionHeaderTitle} size="xl" weight="semiBold">
				{title}
			</Text>
		</div>
	);
}
