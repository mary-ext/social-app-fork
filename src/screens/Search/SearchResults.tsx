import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { AnyProfileView, AppBskyFeedDefs as AtcAppBskyFeedDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { urls } from '#/lib/constants';
import { definite } from '#/lib/functions';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import { useCallOnce } from '#/lib/once';
import { cleanError } from '#/lib/strings/errors';
import { augmentSearchQuery } from '#/lib/strings/helpers';

import { useActorSearch } from '#/state/queries/actor-search';
import { usePopularFeedsSearch } from '#/state/queries/feed';
import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

import { Post } from '#/view/com/post/Post';
import { ProfileCardWithFollowBtn } from '#/view/com/profile/ProfileCard';
import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as FeedCard from '#/components/FeedCard';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { ListFooter } from '#/components/Lists';
import { SearchError } from '#/components/SearchError';
import { Text } from '#/components/Typography';
import { type Section, Tabs } from '#/components/web/Tabs';

export type SearchTabId = 'feeds' | 'latest' | 'people' | 'top';

type SearchResultPressTab = SearchTabId | undefined;

let SearchResults = ({
	query,
	queryWithParams,
	activeTab,
	onTabChange,
	headerHeight,
}: {
	query: string;
	queryWithParams: string;
	activeTab: SearchTabId;
	onTabChange: (tab: SearchTabId) => void;
	headerHeight: number;
}): React.ReactNode => {
	const { t: l } = useLingui();

	const sections = useMemo(() => {
		if (!queryWithParams) return [];
		const noParams = queryWithParams === query;
		return definite<Section<SearchTabId>>([
			{
				id: 'top',
				label: l`Top`,
				render: (focused) => <SearchScreenPostResults query={queryWithParams} sort="top" active={focused} />,
			},
			{
				id: 'latest',
				label: l`Latest`,
				render: (focused) => (
					<SearchScreenPostResults query={queryWithParams} sort="latest" active={focused} />
				),
			},
			noParams && {
				id: 'people',
				label: l`People`,
				render: (focused) => <SearchScreenUserResults query={query} active={focused} />,
			},
			noParams && {
				id: 'feeds',
				label: l`Feeds`,
				render: (focused) => <SearchScreenFeedsResults query={query} active={focused} />,
			},
		]);
	}, [l, query, queryWithParams]);

	return (
		<Tabs sections={sections} value={activeTab} onValueChange={onTabChange} headerOffset={headerHeight} />
	);
};
SearchResults = memo(SearchResults);
export { SearchResults };

function Loader() {
	return (
		<Layout.Content>
			<View style={[a.py_xl]}>
				<ActivityIndicator />
			</View>
		</Layout.Content>
	);
}

function EmptyState({
	messageText,
	error,
	children,
}: {
	messageText: React.ReactNode;
	error?: string;
	children?: React.ReactNode;
}) {
	const t = useTheme();

	return (
		<Layout.Content>
			<View style={[a.p_xl]}>
				<View style={[t.atoms.bg_contrast_25, a.rounded_sm, a.p_lg]}>
					<Text style={[a.text_md]}>{messageText}</Text>

					{error && (
						<>
							<View
								style={[
									{
										marginVertical: 12,
										height: 1,
										width: '100%',
										backgroundColor: t.atoms.text.color,
										opacity: 0.2,
									},
								]}
							/>

							<Text style={[t.atoms.text_contrast_medium]}>
								<Trans>Error: {error}</Trans>
							</Text>
						</>
					)}

					{children}
				</View>
			</View>
		</Layout.Content>
	);
}

function NoResultsText({ query }: { sort?: 'top' | 'latest' | 'people' | 'feeds'; query: string }) {
	const t = useTheme();
	const { t: l } = useLingui();

	return (
		<>
			<Text style={[a.text_lg, t.atoms.text_contrast_high]}>
				<Trans>
					No results found for “<Text style={[a.text_lg, t.atoms.text, a.font_medium]}>{query}</Text>
					”.
				</Trans>
			</Text>
			{'\n\n'}
			<Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
				<Trans context="english-only-resource">
					Try a different search term, or{' '}
					<InlineLinkText
						label={l({
							message: 'read about how to use search filters',
							context: 'english-only-resource',
						})}
						to={urls.website.blog.searchTipsAndTricks}
						style={[a.text_md, a.leading_snug]}
					>
						read about how to use search filters
					</InlineLinkText>
					.
				</Trans>
			</Text>
		</>
	);
}

type SearchResultSlice =
	| {
			type: 'post';
			key: string;
			post: AtcAppBskyFeedDefs.PostView;
	  }
	| {
			type: 'loadingMore';
			key: string;
	  };

let SearchScreenPostResults = ({
	query,
	sort,
	active,
}: {
	query: string;
	sort?: 'top' | 'latest';
	active: boolean;
}): React.ReactNode => {
	const { t: l } = useLingui();
	const { currentAccount, hasSession } = useSession();
	const [isPTR, setIsPTR] = useState(false);
	const trackPostView = usePostViewTracking('SearchResults');

	const augmentedQuery = useMemo(() => {
		return augmentSearchQuery(query || '', { did: currentAccount?.did });
	}, [query, currentAccount]);

	const {
		isFetched,
		data: results,
		isFetching,
		error,
		refetch,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useSearchPostsQuery({ query: augmentedQuery, sort, enabled: active });

	const t = useTheme();
	const onPullToRefresh = useCallback(async () => {
		setIsPTR(true);
		await refetch();
		setIsPTR(false);
	}, [setIsPTR, refetch]);
	const onEndReached = useCallback(() => {
		if (isFetching || !hasNextPage || error) return;
		void fetchNextPage();
	}, [isFetching, error, hasNextPage, fetchNextPage]);

	const posts = useMemo(() => {
		return results?.pages.flatMap((page) => page.posts) || [];
	}, [results]);
	const items = useMemo(() => {
		let temp: SearchResultSlice[] = [];

		const seenUris = new Set();
		for (const post of posts) {
			if (seenUris.has(post.uri)) {
				continue;
			}
			temp.push({
				type: 'post',
				key: post.uri,
				post: post,
			});
			seenUris.add(post.uri);
		}

		if (isFetchingNextPage) {
			temp.push({
				type: 'loadingMore',
				key: 'loadingMore',
			});
		}

		return temp;
	}, [posts, isFetchingNextPage]);

	const closeAllActiveElements = useCloseAllActiveElements();
	const { signinDialogControl } = useGlobalDialogsControlContext();

	const fireTracking = useCallOnce(() => {
		if (sort) {
		}
	});
	if (isFetched && sort) {
		fireTracking();
	}

	const showSignIn = () => {
		closeAllActiveElements();
		signinDialogControl.open({});
	};

	if (!hasSession) {
		return (
			<SearchError title={l`Search is currently unavailable when logged out`}>
				<Text style={[a.text_md, a.text_center, a.leading_snug]}>
					<Trans>
						<InlineLinkText label={l`Sign in`} to="#" onPress={showSignIn}>
							Sign in
						</InlineLinkText>
						<Text> </Text>
						<Text style={t.atoms.text_contrast_medium}>
							to search for news, sports, politics, and everything else happening on Bluesky.
						</Text>
					</Trans>
				</Text>
			</SearchError>
		);
	}

	return error ? (
		<EmptyState
			messageText={l`We’re sorry, but your search could not be completed. Please try again in a few minutes.`}
			error={cleanError(error)}
		/>
	) : (
		<>
			{isFetched ? (
				<>
					{posts.length ? (
						<List
							data={items}
							renderItem={({ item, index }: { item: SearchResultSlice; index: number }) => {
								if (item.type === 'post') {
									return <SearchPost from={sort} position={index} post={item.post} />;
								} else {
									return null;
								}
							}}
							keyExtractor={(item: SearchResultSlice) => item.key}
							refreshing={isPTR}
							onRefresh={() => {
								void onPullToRefresh();
							}}
							onEndReached={onEndReached}
							onItemSeen={(item: SearchResultSlice) => {
								if (item.type === 'post') {
									trackPostView(item.post);
								}
							}}
							desktopFixedHeight
							ListFooterComponent={
								<ListFooter isFetchingNextPage={isFetchingNextPage} hasNextPage={hasNextPage} />
							}
						/>
					) : (
						<EmptyState messageText={<NoResultsText query={query} />} />
					)}
				</>
			) : (
				<Loader />
			)}
		</>
	);
};
SearchScreenPostResults = memo(SearchScreenPostResults);

function SearchPost({
	from,
	position,
	post,
}: {
	from: SearchResultPressTab;
	position: number;
	post: AtcAppBskyFeedDefs.PostView;
}) {
	const onBeforePress = useCallback(() => {}, [from, position, post]);

	// the sticky tab bar already draws the divider above the first row
	return <Post post={post} hideTopBorder={position === 0} onBeforePress={onBeforePress} />;
}

let SearchScreenUserResults = ({ query, active }: { query: string; active: boolean }): React.ReactNode => {
	const { t: l } = useLingui();
	const { hasSession } = useSession();
	const [isPTR, setIsPTR] = useState(false);

	const {
		isFetched,
		data: results,
		isFetching,
		error,
		refetch,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useActorSearch({
		query,
		enabled: active,
	});

	const onPullToRefresh = useCallback(async () => {
		setIsPTR(true);
		await refetch();
		setIsPTR(false);
	}, [setIsPTR, refetch]);
	const onEndReached = useCallback(() => {
		if (!hasSession) return;
		if (isFetching || !hasNextPage || error) return;
		void fetchNextPage();
	}, [isFetching, error, hasNextPage, fetchNextPage, hasSession]);

	const profiles = useMemo(() => {
		return results?.pages.flatMap((page) => page.actors) || [];
	}, [results]);

	const fireTracking = useCallOnce(() => {});
	if (isFetched) {
		fireTracking();
	}

	if (error) {
		return (
			<EmptyState
				messageText={l`We’re sorry, but your search could not be completed. Please try again in a few minutes.`}
				error={error.toString()}
			/>
		);
	}

	return isFetched && profiles ? (
		<>
			{profiles.length ? (
				<List
					data={profiles}
					renderItem={({ item, index }: { item: AnyProfileView; index: number }) => (
						<SearchScreenProfileButton position={index} profile={item} />
					)}
					keyExtractor={(item: AnyProfileView) => item.did}
					refreshing={isPTR}
					onRefresh={() => void onPullToRefresh()}
					onEndReached={onEndReached}
					desktopFixedHeight
					ListFooterComponent={
						<ListFooter hasNextPage={hasNextPage && hasSession} isFetchingNextPage={isFetchingNextPage} />
					}
				/>
			) : (
				<EmptyState messageText={<NoResultsText query={query} />} />
			)}
		</>
	) : (
		<Loader />
	);
};
SearchScreenUserResults = memo(SearchScreenUserResults);

function SearchScreenProfileButton({ position, profile }: { position: number; profile: AnyProfileView }) {
	const handlePress = () => {};
	// the sticky tab bar already draws the divider above the first row
	return <ProfileCardWithFollowBtn profile={profile} noBorder={position === 0} onPress={handlePress} />;
}

let SearchScreenFeedsResults = ({ query, active }: { query: string; active: boolean }): React.ReactNode => {
	const t = useTheme();

	const { data: results, isFetched } = usePopularFeedsSearch({
		query,
		enabled: active,
	});

	const fireTracking = useCallOnce(() => {});
	if (isFetched) {
		fireTracking();
	}

	return isFetched && results ? (
		<>
			{results.length ? (
				<List
					data={results}
					renderItem={({ item, index }: { item: AtcAppBskyFeedDefs.GeneratorView; index: number }) => (
						// the sticky tab bar already draws the divider above the first row
						<View style={[index !== 0 && [a.border_t, t.atoms.border_contrast_low], a.px_lg, a.py_lg]}>
							<SearchFeedCard position={index} view={item} />
						</View>
					)}
					keyExtractor={(item: AtcAppBskyFeedDefs.GeneratorView) => item.uri}
					desktopFixedHeight
					ListFooterComponent={<ListFooter />}
				/>
			) : (
				<EmptyState messageText={<NoResultsText query={query} />} />
			)}
		</>
	) : (
		<Loader />
	);
};
SearchScreenFeedsResults = memo(SearchScreenFeedsResults);

function SearchFeedCard({
	position: _position,
	view,
}: {
	position: number;
	view: AtcAppBskyFeedDefs.GeneratorView;
}) {
	const handleOnPress = () => {};

	return <FeedCard.Default view={view} onPress={handleOnPress} />;
}
