import { useCallback, useMemo, useState } from 'react';
import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import * as bcp47Match from 'bcp-47-match';

import { boostInterests, popularInterests, useInterestsDisplayNames } from '#/lib/interests';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useLanguagePrefs } from '#/state/preferences/languages';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { type FeedPreviewItem, useFeedPreviews } from '#/state/queries/explore-feed-previews';
import { useGetPopularFeedsQuery } from '#/state/queries/feed';
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
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import * as ProfileCard from '#/components/web/ProfileCard';

import { colors } from '#/styles/colors';

import * as ModuleHeader from './components/ModuleHeader';
import { StarterPackCard, StarterPackCardSkeleton } from './components/StarterPackCard';
import * as css from './Explore.css';
import { SuggestedAccountsTabBar, SuggestedProfileCard } from './modules/ExploreSuggestedAccounts';
import { ExploreTrendingTopics } from './modules/ExploreTrendingTopics';

type ExploreSearchButtonModule = 'suggestedAccounts' | 'suggestedFeeds';

function LoadMore({ item }: { item: ExploreScreenItems & { type: 'loadMore' } }) {
	const { t: l } = useLingui();

	return (
		<button
			aria-label={l`Load more`}
			className={css.loadMore}
			onClick={() => void item.onLoadMore()}
			type="button"
		>
			<Text>{item.message}</Text>
			{item.isLoadingMore ? (
				<Spinner color={colors.textContrastMedium} label={null} size="sm" />
			) : (
				<ChevronDownIcon fill={colors.textContrastMedium} size="sm" />
			)}
		</button>
	);
}

type ExploreScreenItems =
	| {
			type: 'topBorder';
			key: string;
	  }
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
			hideDefaultTab?: boolean;
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
			isLoadingMore: boolean;
			onLoadMore: () => void | Promise<void>;
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
	const { t: l } = useLingui();
	const { data: preferences, error: preferencesError } = usePreferencesQuery();
	const moderationOpts = useModerationOpts();
	const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

	/*
	 * Begin special language handling
	 */
	const { contentLanguages } = useLanguagePrefs();
	const useFullExperience = useMemo(() => {
		if (contentLanguages.length === 0) return true;
		return bcp47Match.basicFilter('en', contentLanguages).length > 0;
	}, [contentLanguages]);
	const personalizedInterests = preferences?.interests?.tags;
	const interestsDisplayNames = useInterestsDisplayNames();
	const interests = Object.keys(interestsDisplayNames)
		.sort(boostInterests(popularInterests))
		.sort(boostInterests(personalizedInterests));
	const {
		data: suggestedUsers,
		isLoading: suggestedUsersIsLoading,
		error: suggestedUsersError,
		isRefetching: suggestedUsersIsRefetching,
	} = useGetSuggestedUsersForExploreQuery({
		category: selectedInterest || (useFullExperience ? null : interests[0]),
	});
	/* End special language handling */

	const {
		data: feeds,
		hasNextPage: hasNextFeedsPage,
		isLoading: isLoadingFeeds,
		isFetchingNextPage: isFetchingNextFeedsPage,
		error: feedsError,
		fetchNextPage: fetchNextFeedsPage,
	} = useGetPopularFeedsQuery({ limit: 10, enabled: useFullExperience });
	const {
		data: suggestedSPs,
		isLoading: isLoadingSuggestedSPs,
		error: suggestedSPsError,
		isRefetching: isRefetchingSuggestedSPs,
	} = useSuggestedStarterPacksQuery({ enabled: useFullExperience });

	const isLoadingMoreFeeds = isFetchingNextFeedsPage && !isLoadingFeeds;
	const [hasPressedLoadMoreFeeds, setHasPressedLoadMoreFeeds] = useState(false);
	const onLoadMoreFeeds = useCallback(async () => {
		if (isFetchingNextFeedsPage || !hasNextFeedsPage || feedsError) return;
		if (!hasPressedLoadMoreFeeds) {
			setHasPressedLoadMoreFeeds(true);
			return;
		}
		try {
			await fetchNextFeedsPage();
		} catch (err) {
			logger.error('Failed to load more suggested follows', { message: err });
		}
	}, [isFetchingNextFeedsPage, hasNextFeedsPage, feedsError, fetchNextFeedsPage, hasPressedLoadMoreFeeds]);

	const { data: suggestedFeeds, error: suggestedFeedsError } = useGetSuggestedFeedsQuery({
		enabled: useFullExperience,
	});
	const {
		data: feedPreviewSlices,
		query: {
			isPending: isPendingFeedPreviews,
			isFetchingNextPage: isFetchingNextPageFeedPreviews,
			fetchNextPage: fetchNextPageFeedPreviews,
			hasNextPage: hasNextPageFeedPreviews,
			error: feedPreviewSlicesError,
		},
	} = useFeedPreviews(suggestedFeeds?.feeds ?? [], useFullExperience);

	const onLoadMoreFeedPreviews = useCallback(async () => {
		if (
			isPendingFeedPreviews ||
			isFetchingNextPageFeedPreviews ||
			!hasNextPageFeedPreviews ||
			feedPreviewSlicesError
		)
			return;
		try {
			await fetchNextPageFeedPreviews();
		} catch (err) {
			logger.error('Failed to load more feed previews', { message: err });
		}
	}, [
		isPendingFeedPreviews,
		isFetchingNextPageFeedPreviews,
		hasNextPageFeedPreviews,
		feedPreviewSlicesError,
		fetchNextPageFeedPreviews,
	]);

	const topBorder = useMemo(
		() =>
			({
				type: 'topBorder',
				key: 'top-border',
			}) as const,
		[],
	);
	const trendingTopicsModule = useMemo(
		() =>
			({
				type: 'trendingTopics',
				key: 'trending-topics',
			}) as const,
		[],
	);
	const suggestedFollowsModule = useMemo(() => {
		const i: ExploreScreenItems[] = [];
		i.push({
			type: 'tabbedHeader',
			key: 'suggested-accounts-header',
			title: l`Suggested accounts`,
			icon: Person,
			searchButton: {
				label: l`Search for more accounts`,
				metricsTag: 'suggestedAccounts',
				tab: 'user',
			},
			hideDefaultTab: !useFullExperience,
		});

		if (suggestedUsersIsLoading || suggestedUsersIsRefetching) {
			i.push({ type: 'profilePlaceholder', key: 'profilePlaceholder' });
		} else if (suggestedUsersError) {
			i.push({
				type: 'error',
				key: 'suggestedUsersError',
				message: l`Failed to load suggested follows`,
				error: cleanError(suggestedUsersError),
			});
		} else {
			if (suggestedUsers !== undefined) {
				if (suggestedUsers.actors.length > 0 && moderationOpts) {
					// Currently the responses contain duplicate items.
					// Needs to be fixed on backend, but let's dedupe to be safe.
					let seen = new Set();
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
						if (selectedInterest === null && useFullExperience) {
							// First "For You" tab, only show 5 to keep screen short
							i.push(...profileItems.slice(0, 5));
						} else {
							i.push(...profileItems);
						}
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
	}, [
		l,
		moderationOpts,
		suggestedUsers,
		suggestedUsersIsLoading,
		suggestedUsersIsRefetching,
		suggestedUsersError,
		selectedInterest,
		useFullExperience,
	]);
	const suggestedFeedsModule = useMemo(() => {
		const i: ExploreScreenItems[] = [];
		i.push({
			type: 'header',
			key: 'suggested-feeds-header',
			title: l`Discover new feeds`,
			icon: ListSparkle,
			searchButton: {
				label: l`Search for more feeds`,
				metricsTag: 'suggestedFeeds',
				tab: 'feed',
			},
		});

		if (useFullExperience) {
			if (suggestedFeeds && preferences) {
				let seen = new Set();
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

				// feeds errors can occur during pagination, so feeds is truthy
				if (suggestedFeedsError) {
					i.push({
						type: 'error',
						key: 'suggestedFeedsError',
						message: l`Failed to load suggested feeds`,
						error: cleanError(suggestedFeedsError),
					});
				} else if (preferencesError) {
					i.push({
						type: 'error',
						key: 'preferencesError',
						message: l`Failed to load feeds preferences`,
						error: cleanError(preferencesError),
					});
				} else {
					if (feedItems.length === 0) {
						i.pop();
					} else {
						// This query doesn't follow the limit very well, so the first press of the
						// load more button just unslices the array back to ~10 items
						if (!hasPressedLoadMoreFeeds) {
							i.push(...feedItems.slice(0, 6));
						} else {
							i.push(...feedItems);
						}
					}
					if (!hasPressedLoadMoreFeeds) {
						i.push({
							type: 'loadMore',
							key: 'loadMoreFeeds',
							message: l`Load more suggested feeds`,
							isLoadingMore: isLoadingMoreFeeds,
							onLoadMore: onLoadMoreFeeds,
						});
					} else if (feedItems.length > 0) {
						// no load-more button to close the list — draw a footer so the last feed keeps a divider
						i.push({ type: 'preview:footer', key: 'suggested-feeds-footer' });
					}
				}
			} else {
				if (feedsError) {
					i.push({
						type: 'error',
						key: 'feedsError',
						message: l`Failed to load feeds`,
						error: cleanError(feedsError),
					});
				} else if (suggestedFeedsError) {
					i.push({
						type: 'error',
						key: 'suggestedFeedsError',
						message: l`Failed to load suggested feeds`,
						error: cleanError(suggestedFeedsError),
					});
				} else if (preferencesError) {
					i.push({
						type: 'error',
						key: 'preferencesError',
						message: l`Failed to load feeds preferences`,
						error: cleanError(preferencesError),
					});
				} else {
					i.push({ type: 'feedPlaceholder', key: 'feedPlaceholder' });
					// close the placeholder list with a divider, as the loaded list does
					i.push({ type: 'preview:footer', key: 'suggested-feeds-footer' });
				}
			}
		} else {
			if (feeds && preferences) {
				// Currently the responses contain duplicate items.
				// Needs to be fixed on backend, but let's dedupe to be safe.
				let seen = new Set();
				const feedItems: ExploreScreenItems[] = [];
				for (const page of feeds.pages) {
					for (const feed of page.feeds) {
						if (!seen.has(feed.uri)) {
							seen.add(feed.uri);
							feedItems.push({
								type: 'feed',
								key: feed.uri,
								feed,
							});
						}
					}
				}

				// feeds errors can occur during pagination, so feeds is truthy
				if (feedsError) {
					i.push({
						type: 'error',
						key: 'feedsError',
						message: l`Failed to load feeds`,
						error: cleanError(feedsError),
					});
				} else if (suggestedFeedsError) {
					i.push({
						type: 'error',
						key: 'suggestedFeedsError',
						message: l`Failed to load suggested feeds`,
						error: cleanError(suggestedFeedsError),
					});
				} else if (preferencesError) {
					i.push({
						type: 'error',
						key: 'preferencesError',
						message: l`Failed to load feeds preferences`,
						error: cleanError(preferencesError),
					});
				} else {
					if (feedItems.length === 0) {
						if (!hasNextFeedsPage) {
							i.pop();
						}
					} else {
						// This query doesn't follow the limit very well, so the first press of the
						// load more button just unslices the array back to ~10 items
						if (!hasPressedLoadMoreFeeds) {
							i.push(...feedItems.slice(0, 3));
						} else {
							i.push(...feedItems);
						}
					}
					if (hasNextFeedsPage) {
						i.push({
							type: 'loadMore',
							key: 'loadMoreFeeds',
							message: l`Load more suggested feeds`,
							isLoadingMore: isLoadingMoreFeeds,
							onLoadMore: onLoadMoreFeeds,
						});
					} else if (feedItems.length > 0) {
						// no load-more button to close the list — draw a footer so the last feed keeps a divider
						i.push({ type: 'preview:footer', key: 'suggested-feeds-footer' });
					}
				}
			} else {
				if (feedsError) {
					i.push({
						type: 'error',
						key: 'feedsError',
						message: l`Failed to load feeds`,
						error: cleanError(feedsError),
					});
				} else if (suggestedFeedsError) {
					i.push({
						type: 'error',
						key: 'feedsError',
						message: l`Failed to load suggested feeds`,
						error: cleanError(suggestedFeedsError),
					});
				} else if (preferencesError) {
					i.push({
						type: 'error',
						key: 'preferencesError',
						message: l`Failed to load feeds preferences`,
						error: cleanError(preferencesError),
					});
				} else {
					i.push({ type: 'feedPlaceholder', key: 'feedPlaceholder' });
					// close the placeholder list with a divider, as the loaded list does
					i.push({ type: 'preview:footer', key: 'suggested-feeds-footer' });
				}
			}
		}
		return i;
	}, [
		l,
		useFullExperience,
		suggestedFeeds,
		preferences,
		suggestedFeedsError,
		preferencesError,
		feedsError,
		hasNextFeedsPage,
		hasPressedLoadMoreFeeds,
		isLoadingMoreFeeds,
		onLoadMoreFeeds,
		feeds,
	]);

	const suggestedStarterPacksModule = useMemo(() => {
		const i: ExploreScreenItems[] = [];
		i.push({
			type: 'header',
			key: 'suggested-starterPacks-header',
			title: l`Starter Packs`,
			icon: StarterPack,
			iconSize: 'xl',
		});

		if (isLoadingSuggestedSPs || isRefetchingSuggestedSPs) {
			Array.from({ length: 3 }).forEach((__, index) =>
				i.push({
					type: 'starterPackSkeleton',
					key: `starterPackSkeleton-${index}`,
				}),
			);
		} else if (suggestedSPsError || !suggestedSPs) {
			// just get rid of the section
			i.pop();
		} else {
			suggestedSPs.starterPacks.map((s) => {
				i.push({
					type: 'starterPack',
					key: s.uri,
					view: s,
				});
			});
		}
		return i;
	}, [suggestedSPs, l, isLoadingSuggestedSPs, suggestedSPsError, isRefetchingSuggestedSPs]);
	const feedPreviewsModule = useMemo(() => {
		const i: ExploreScreenItems[] = [];
		i.push(...feedPreviewSlices);
		if (isFetchingNextPageFeedPreviews) {
			i.push({
				type: 'preview:loading',
				key: 'preview-loading-more',
			});
		}
		return i;
	}, [feedPreviewSlices, isFetchingNextPageFeedPreviews]);

	const items = useMemo<ExploreScreenItems[]>(() => {
		const i: ExploreScreenItems[] = [];

		// Dynamic module ordering

		i.push(topBorder);

		if (useFullExperience) {
			i.push(trendingTopicsModule);
			i.push(...suggestedFeedsModule);
			i.push(...suggestedFollowsModule);
			i.push(...suggestedStarterPacksModule);
			i.push(...feedPreviewsModule);
		} else {
			i.push(...suggestedFollowsModule);
		}

		return i;
	}, [
		topBorder,
		suggestedFollowsModule,
		suggestedStarterPacksModule,
		suggestedFeedsModule,
		trendingTopicsModule,
		feedPreviewsModule,
		useFullExperience,
	]);

	const renderItem = useCallback(
		({ item }: { item: ExploreScreenItems }) => {
			switch (item.type) {
				case 'topBorder': {
					return <div className={css.topBorder} />;
				}
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
								hideDefaultTab={item.hideDefaultTab}
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
								{selectedInterest ? (
									<Trans>No results for "{interestsDisplayNames[selectedInterest]}".</Trans>
								) : (
									<Trans>No results.</Trans>
								)}
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
					return (
						<>
							{Array.from({ length: 3 }).map((__, i) => (
								<div className={css.profilePlaceholder} key={i}>
									<ProfileCard.Outer>
										<ProfileCard.Header>
											<ProfileCard.AvatarPlaceholder />
											<ProfileCard.NameAndHandlePlaceholder />
										</ProfileCard.Header>
										<ProfileCard.DescriptionPlaceholder numberOfLines={2} />
									</ProfileCard.Outer>
								</div>
							))}
						</>
					);
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
								<CircleInfo fill={colors.negative_400} size="md" />
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
					return <CenteredSpinner label={l`Loading`} size="lg" />;
				}
				case 'preview:header': {
					return (
						<ModuleHeader.Container bottomBorder className={css.previewHeader}>
							<ModuleHeader.FeedLink feed={item.feed}>
								<ModuleHeader.FeedAvatar feed={item.feed} />

								<div className={css.previewHeaderText}>
									<ModuleHeader.TitleText size="lg">{item.feed.displayName}</ModuleHeader.TitleText>
									<ModuleHeader.SubtitleText>
										<Trans>by {sanitizeHandle(item.feed.creator.handle)}</Trans>
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
							label={l`There was an issue fetching posts. Tap here to try again.`}
							onPress={() => void fetchNextPageFeedPreviews()}
						/>
					);
				}
			}
		},
		[focusSearchInput, selectedInterest, moderationOpts, interestsDisplayNames, l, fetchNextPageFeedPreviews],
	);

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
