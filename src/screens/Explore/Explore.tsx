import { useState } from 'react';

import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';

import { useInterestsDisplayNames } from '#/lib/interests';
import { cleanError } from '#/lib/strings/errors';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { type FeedPreviewItem, useFeedPreviews } from '#/state/queries/explore-feed-previews';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useGetSuggestedFeedsQuery } from '#/state/queries/trending/useGetSuggestedFeedsQuery';
import { useGetSuggestedUsersForExploreQuery } from '#/state/queries/trending/useGetSuggestedUsersForExploreQuery';
import { useSuggestedStarterPacksQuery } from '#/state/queries/useSuggestedStarterPacksQuery';

import { logger } from '#/logger';

import { isThreadChildAt, isThreadParentAt } from '#/view/com/posts/PostFeed';
import { PostFeedItem } from '#/view/com/posts/PostFeedItem';
import { ViewFullThread } from '#/view/com/posts/ViewFullThread';
import { LoadMoreRetryBtn } from '#/view/com/util/LoadMoreRetryBtn';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as FeedCard from '#/components/FeedCard';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon } from '#/components/icons/Chevron';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import type { Props as IcoProps, Props as SVGIconProps } from '#/components/icons/common';
import { ListSparkle_Stroke2_Corner0_Rounded as ListSparkle } from '#/components/icons/ListSparkle';
import { StarterPack } from '#/components/icons/StarterPack';
import { UserCircle_Stroke2_Corner0_Rounded as Person } from '#/components/icons/UserCircle';
import { List } from '#/components/List/List';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as ModuleHeader from './components/ModuleHeader';
import { StarterPackCard, StarterPackCardSkeleton } from './components/StarterPackCard';
import * as css from './Explore.css';
import { SuggestedAccountsTabBar, SuggestedProfileCard } from './modules/ExploreSuggestedAccounts';
import { ExploreTrendingTopics } from './modules/ExploreTrendingTopics';

type ExploreSearchButtonModule = 'suggestedAccounts' | 'suggestedFeeds';

function LoadMore({ item }: { item: ExploreScreenItems & { type: 'loadMore' } }) {
	return (
		<button
			aria-label={m['screens.search.explore.loadMore']()}
			className={css.loadMore}
			onClick={() => item.onLoadMore()}
			type="button"
		>
			<Text>{item.message}</Text>
			<ChevronDownIcon fill={colors.textContrastMedium} size="sm" />
		</button>
	);
}

type ExploreScreenItems =
	| {
			type: 'header';
			key: string;
			title: string;
			icon: React.ComponentType<SVGIconProps>;
			iconSize?: IcoProps['size'];
			bottomBorder?: boolean;
			searchButton?: {
				label: string;
				metricsTag: ExploreSearchButtonModule;
				tab: 'feed' | 'profile' | 'user';
			};
	  }
	| {
			type: 'tabbedHeader';
			key: string;
			title: string;
			icon: React.ComponentType<SVGIconProps>;
			searchButton?: {
				label: string;
				metricsTag: ExploreSearchButtonModule;
				tab: 'feed' | 'profile' | 'user';
			};
	  }
	| {
			type: 'trendingTopics';
			key: string;
	  }
	| {
			type: 'profile';
			key: string;
			profile: AppBskyActorDefs.ProfileView;
			recId?: string;
	  }
	| {
			type: 'profileEmpty';
			key: 'profileEmpty';
	  }
	| {
			type: 'feed';
			key: string;
			feed: AppBskyFeedDefs.GeneratorView;
	  }
	| {
			type: 'loadMore';
			key: string;
			message: string;
			onLoadMore: () => void;
	  }
	| {
			type: 'profilePlaceholder';
			key: string;
	  }
	| {
			type: 'feedPlaceholder';
			key: string;
	  }
	| {
			type: 'error';
			key: string;
			message: string;
			error: string;
	  }
	| {
			type: 'starterPack';
			key: string;
			view: AppBskyGraphDefs.StarterPackView;
	  }
	| {
			type: 'starterPackSkeleton';
			key: string;
	  }
	| FeedPreviewItem;

export function Explore({
	focusSearchInput,
}: {
	focusSearchInput: (tab: 'feed' | 'profile' | 'user') => void;
}) {
	const { data: preferences, error: preferencesError } = usePreferencesQuery();
	const moderationOpts = useModerationOpts();
	const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

	const interestsDisplayNames = useInterestsDisplayNames();
	const {
		data: suggestedUsers,
		isLoading: suggestedUsersIsLoading,
		error: suggestedUsersError,
		isRefetching: suggestedUsersIsRefetching,
	} = useGetSuggestedUsersForExploreQuery({
		category: selectedInterest,
	});

	const {
		data: suggestedSPs,
		isLoading: isLoadingSuggestedSPs,
		error: suggestedSPsError,
		isRefetching: isRefetchingSuggestedSPs,
	} = useSuggestedStarterPacksQuery({});

	// suggested feeds arrive in one query; "show more" just reveals the rest client-side
	const [showAllFeeds, setShowAllFeeds] = useState(false);

	const { data: suggestedFeeds, error: suggestedFeedsError } = useGetSuggestedFeedsQuery({});
	const {
		data: feedPreviewSlices,
		query: {
			isPending: isPendingFeedPreviews,
			isFetchingNextPage: isFetchingNextPageFeedPreviews,
			fetchNextPage: fetchNextPageFeedPreviews,
			hasNextPage: hasNextPageFeedPreviews,
			error: feedPreviewSlicesError,
		},
	} = useFeedPreviews(suggestedFeeds?.feeds ?? []);

	const onLoadMoreFeedPreviews = async () => {
		if (
			isPendingFeedPreviews ||
			isFetchingNextPageFeedPreviews ||
			!hasNextPageFeedPreviews ||
			feedPreviewSlicesError
		) {
			return;
		}
		try {
			await fetchNextPageFeedPreviews();
		} catch (err) {
			logger.error('Failed to load more feed previews', { message: err });
		}
	};

	const trendingTopicsModule = {
		type: 'trendingTopics',
		key: 'trending-topics',
	} as const;

	const suggestedFollowsModule = ((): ExploreScreenItems[] => {
		const i: ExploreScreenItems[] = [];
		i.push({
			type: 'tabbedHeader',
			key: 'suggested-accounts-header',
			title: m['screens.search.account.title'](),
			icon: Person,
			searchButton: {
				label: m['screens.search.account.searchMore'](),
				metricsTag: 'suggestedAccounts',
				tab: 'user',
			},
		});

		if (suggestedUsersIsLoading || suggestedUsersIsRefetching) {
			i.push({ type: 'profilePlaceholder', key: 'profilePlaceholder' });
		} else if (suggestedUsersError) {
			i.push({
				type: 'error',
				key: 'suggestedUsersError',
				message: m['screens.search.account.loadError'](),
				error: cleanError(suggestedUsersError),
			});
		} else {
			if (suggestedUsers !== undefined) {
				if (suggestedUsers.actors.length > 0 && moderationOpts) {
					// Currently the responses contain duplicate items.
					// Needs to be fixed on backend, but let's dedupe to be safe.
					const seen = new Set();
					const profileItems: ExploreScreenItems[] = [];
					for (const actor of suggestedUsers.actors) {
						// checking for following still necessary if search data is used
						if (!seen.has(actor.did) && !actor.viewer?.following) {
							seen.add(actor.did);
							profileItems.push({
								type: 'profile',
								key: actor.did,
								profile: actor,
								recId: suggestedUsers.recId,
							});
						}
					}

					if (profileItems.length === 0) {
						i.push({
							type: 'profileEmpty',
							key: 'profileEmpty',
						});
					} else {
						if (selectedInterest === null) {
							// First "For You" tab, only show 5 to keep screen short
							i.push(...profileItems.slice(0, 5));
						} else {
							i.push(...profileItems);
						}

						i.push({
							type: 'preview:footer',
							key: 'suggested-follows-footer',
						});
					}
				} else {
					i.push({
						type: 'profileEmpty',
						key: 'profileEmpty',
					});
				}
			} else {
				i.push({ type: 'profilePlaceholder', key: 'profilePlaceholder' });
			}
		}
		return i;
	})();

	const suggestedFeedsModule = ((): ExploreScreenItems[] => {
		const i: ExploreScreenItems[] = [];
		i.push({
			type: 'header',
			key: 'suggested-feeds-header',
			title: m['screens.search.feeds.title'](),
			icon: ListSparkle,
			searchButton: {
				label: m['screens.search.feeds.searchMore'](),
				metricsTag: 'suggestedFeeds',
				tab: 'feed',
			},
		});

		if (suggestedFeeds && preferences) {
			const seen = new Set();
			const feedItems: ExploreScreenItems[] = [];
			for (const feed of suggestedFeeds.feeds) {
				if (!seen.has(feed.uri)) {
					seen.add(feed.uri);
					feedItems.push({
						type: 'feed',
						key: feed.uri,
						feed,
					});
				}
			}

			if (suggestedFeedsError) {
				i.push({
					type: 'error',
					key: 'suggestedFeedsError',
					message: m['screens.search.feeds.error.loadSuggested'](),
					error: cleanError(suggestedFeedsError),
				});
			} else if (preferencesError) {
				i.push({
					type: 'error',
					key: 'preferencesError',
					message: m['screens.search.feeds.error.loadPrefs'](),
					error: cleanError(preferencesError),
				});
			} else {
				if (feedItems.length === 0) {
					i.pop();
				} else {
					// show a short list by default; the load-more button reveals the rest
					if (!showAllFeeds) {
						i.push(...feedItems.slice(0, 6));
					} else {
						i.push(...feedItems);
					}
				}
				if (!showAllFeeds && feedItems.length > 6) {
					i.push({
						type: 'loadMore',
						key: 'loadMoreFeeds',
						message: m['screens.search.feeds.loadMore'](),
						onLoadMore: () => setShowAllFeeds(true),
					});
				} else if (feedItems.length > 0) {
					// no load-more button to close the list — draw a footer so the last feed keeps a divider
					i.push({ type: 'preview:footer', key: 'suggested-feeds-footer' });
				}
			}
		} else {
			if (suggestedFeedsError) {
				i.push({
					type: 'error',
					key: 'suggestedFeedsError',
					message: m['screens.search.feeds.error.loadSuggested'](),
					error: cleanError(suggestedFeedsError),
				});
			} else if (preferencesError) {
				i.push({
					type: 'error',
					key: 'preferencesError',
					message: m['screens.search.feeds.error.loadPrefs'](),
					error: cleanError(preferencesError),
				});
			} else {
				i.push({ type: 'feedPlaceholder', key: 'feedPlaceholder' });
				// close the placeholder list with a divider, as the loaded list does
				i.push({ type: 'preview:footer', key: 'suggested-feeds-footer' });
			}
		}
		return i;
	})();

	const suggestedStarterPacksModule = ((): ExploreScreenItems[] => {
		const i: ExploreScreenItems[] = [];
		i.push({
			type: 'header',
			key: 'suggested-starterPacks-header',
			title: m['common.starterPack.sectionTitle'](),
			icon: StarterPack,
			iconSize: 'xl',
		});

		if (isLoadingSuggestedSPs || isRefetchingSuggestedSPs) {
			Array.from({ length: 3 }).forEach((__, index) => {
				i.push({
					type: 'starterPackSkeleton',
					key: `starterPackSkeleton-${index}`,
				});
			});
		} else if (suggestedSPsError || !suggestedSPs) {
			// just get rid of the section
			i.pop();
		} else {
			suggestedSPs.starterPacks.forEach((s) => {
				i.push({
					type: 'starterPack',
					key: s.uri,
					view: s,
				});
			});
		}
		return i;
	})();

	const feedPreviewsModule = ((): ExploreScreenItems[] => {
		const i: ExploreScreenItems[] = [];

		i.push(...feedPreviewSlices);

		if (isFetchingNextPageFeedPreviews) {
			i.push({
				type: 'preview:loading',
				key: 'preview-loading-more',
			});
		}
		return i;
	})();

	const items: ExploreScreenItems[] = [
		trendingTopicsModule,
		...suggestedFeedsModule,
		...suggestedFollowsModule,
		...suggestedStarterPacksModule,
		...feedPreviewsModule,
	];

	const renderItem = ({ item }: { item: ExploreScreenItems }) => {
		switch (item.type) {
			case 'header': {
				return (
					<ModuleHeader.Container bottomBorder={item.bottomBorder}>
						<ModuleHeader.Icon icon={item.icon} size={item.iconSize} />
						<ModuleHeader.TitleText>{item.title}</ModuleHeader.TitleText>
						{item.searchButton && (
							<ModuleHeader.SearchButton
								label={item.searchButton.label}
								onClick={() => focusSearchInput(item.searchButton?.tab || 'user')}
							/>
						)}
					</ModuleHeader.Container>
				);
			}
			case 'tabbedHeader': {
				return (
					<div className={css.tabbedHeader}>
						<ModuleHeader.Container className={css.tabbedHeaderInner}>
							<ModuleHeader.Icon icon={item.icon} />
							<ModuleHeader.TitleText>{item.title}</ModuleHeader.TitleText>
							{item.searchButton && (
								<ModuleHeader.SearchButton
									label={item.searchButton.label}
									onClick={() => focusSearchInput(item.searchButton?.tab || 'user')}
								/>
							)}
						</ModuleHeader.Container>
						<SuggestedAccountsTabBar
							onSelectInterest={setSelectedInterest}
							selectedInterest={selectedInterest}
						/>
					</div>
				);
			}
			case 'trendingTopics': {
				return (
					<div className={css.tabbedHeader}>
						<ExploreTrendingTopics />
					</div>
				);
			}
			case 'profile': {
				return <SuggestedProfileCard moderationOpts={moderationOpts!} profile={item.profile} />;
			}
			case 'profileEmpty': {
				return (
					<div className={css.admonitionWrap}>
						<Admonition>
							{selectedInterest
								? m['screens.search.account.emptyInterest']({
										interest: interestsDisplayNames[selectedInterest] ?? '',
									})
								: m['common.search.empty']()}
						</Admonition>
					</div>
				);
			}
			case 'feed': {
				return <FeedCard.Default view={item.feed} />;
			}
			case 'starterPack': {
				return (
					<div className={css.cardWrap}>
						<StarterPackCard view={item.view} />
					</div>
				);
			}
			case 'starterPackSkeleton': {
				return (
					<div className={css.cardWrap}>
						<StarterPackCardSkeleton />
					</div>
				);
			}
			case 'loadMore': {
				return (
					<div className={css.loadMoreWrap}>
						<LoadMore item={item} />
					</div>
				);
			}
			case 'profilePlaceholder': {
				return <ProfileCard.LoadingPlaceholder count={3} topBorder />;
			}
			case 'feedPlaceholder': {
				// topBorder so the first row carries the same divider its real feed cards (and the other
				// placeholders) do beneath the borderless section header
				return <FeedCard.LoadingPlaceholder topBorder />;
			}
			case 'error':
			case 'preview:error': {
				return (
					<div className={css.errorOuter}>
						<div className={css.errorBox}>
							<CircleInfo fill={colors.negative_400} size="lg" />
							<div className={css.errorTextCol}>
								<Text weight="semiBold">{item.message}</Text>
								<Text className={css.errorDetail} color="textContrastMedium">
									{item.error}
								</Text>
							</div>
						</div>
					</div>
				);
			}
			// feed previews
			case 'preview:spacer': {
				return <div className={css.previewSpacer} />;
			}
			case 'preview:empty': {
				return null; // what should we do here?
			}
			case 'preview:loading': {
				return <CenteredSpinner label={m['common.status.loading']()} size="xl" />;
			}
			case 'preview:header': {
				return (
					<ModuleHeader.Container bottomBorder className={css.previewHeader}>
						<ModuleHeader.FeedLink feed={item.feed}>
							<ModuleHeader.FeedAvatar feed={item.feed} />

							<div className={css.previewHeaderText}>
								<ModuleHeader.TitleText size="lg">{item.feed.displayName}</ModuleHeader.TitleText>
								<ModuleHeader.SubtitleText>
									{m['screens.search.byCreator']({
										handle: item.feed.creator.handle,
									})}
								</ModuleHeader.SubtitleText>
							</div>
						</ModuleHeader.FeedLink>
						<ModuleHeader.PinButton feed={item.feed} />
					</ModuleHeader.Container>
				);
			}
			case 'preview:footer': {
				return <div className={css.previewFooter} />;
			}
			case 'preview:sliceItem': {
				const slice = item.slice;
				const indexInSlice = item.indexInSlice;
				const subItem = slice.items[indexInSlice]!;
				return (
					<PostFeedItem
						post={subItem.post}
						record={subItem.record}
						reason={indexInSlice === 0 ? slice.reason : undefined}
						feedContext={slice.feedContext}
						reqId={slice.reqId}
						moderation={subItem.moderation}
						parentAuthor={subItem.parentAuthor}
						showReplyTo={item.showReplyTo}
						isThreadParent={isThreadParentAt(slice.items, indexInSlice)}
						isThreadChild={isThreadChildAt(slice.items, indexInSlice)}
						isParentBlocked={subItem.isParentBlocked}
						isParentNotFound={subItem.isParentNotFound}
						hideTopBorder={item.hideTopBorder}
						rootPost={slice.items[0]!.post}
					/>
				);
			}
			case 'preview:sliceViewFullThread': {
				return <ViewFullThread uri={item.uri} />;
			}
			case 'preview:loadMoreError': {
				return (
					<LoadMoreRetryBtn
						label={m['common.post.fetchError']()}
						onPress={() => void fetchNextPageFeedPreviews()}
					/>
				);
			}
		}
	};

	return (
		<List
			data={items}
			keyExtractor={keyExtractor}
			ListFooterComponent={<div className={css.bottomSpacer} />}
			onEndReached={() => void onLoadMoreFeedPreviews()}
			onEndReachedThreshold={4}
			renderItem={renderItem}
		/>
	);
}

function keyExtractor(item: ExploreScreenItems) {
	return item.key;
}
