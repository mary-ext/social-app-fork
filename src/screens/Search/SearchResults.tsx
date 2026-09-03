import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';

import { definite, uniqueBy } from '@mary/array-fns';

import { isNetworkError, shouldRetryError } from '#/lib/errors';
import { normalizeSearchQuery } from '#/lib/search-query';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useActorSearch } from '#/state/queries/actor-search';
import { usePopularFeedsSearch } from '#/state/queries/feed';
import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useStarterPackSearch } from '#/state/queries/starter-pack-search';
import { useSession } from '#/state/session';

import { Trans } from '#/locale/Trans';

import { BlankState } from '#/components/BlankState';
import { CenteredSpinner } from '#/components/CenteredSpinner';
import { signinDialogHandle } from '#/components/dialogs/handles';
import { ErrorState } from '#/components/ErrorState';
import * as FeedCard from '#/components/FeedCard';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import { Post } from '#/components/Post/Post';
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard';
import { type Section, Tabs } from '#/components/Tabs';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export type SearchTabId = 'feeds' | 'latest' | 'people' | 'starterpacks' | 'top';

export function SearchResults({
	activeTab,
	headerHeight,
	onTabChange,
	query,
	queryWithParams,
}: {
	activeTab: SearchTabId;
	headerHeight: number;
	onTabChange: (tab: SearchTabId) => void;
	query: string;
	queryWithParams: string;
}) {
	let sections: Section<SearchTabId>[] = [];
	if (queryWithParams) {
		const noParams = queryWithParams === query;
		sections = definite<Section<SearchTabId>>([
			{
				id: 'top',
				label: m['common.search.top'](),
				children: <PostResults query={queryWithParams} sort="top" />,
			},
			{
				id: 'latest',
				label: m['common.search.latest'](),
				children: <PostResults query={queryWithParams} sort="latest" />,
			},
			noParams && {
				id: 'people',
				label: m['common.people.label'](),
				children: <UserResults query={query} />,
			},
			noParams && {
				id: 'feeds',
				label: m['common.nav.feeds'](),
				children: <FeedsResults query={query} />,
			},
			noParams && {
				id: 'starterpacks',
				label: m['common.starterPack.sectionTitle'](),
				children: <StarterPackResults query={query} />,
			},
		]);
	}

	return (
		<Tabs headerOffset={headerHeight} onValueChange={onTabChange} sections={sections} value={activeTab} />
	);
}

const POST_ITEM_HEIGHT_ESTIMATE = 300;
const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;
const FEED_ITEM_HEIGHT_ESTIMATE = 120;
const STARTER_PACK_ITEM_HEIGHT_ESTIMATE = 120;

function Pending() {
	return (
		<Layout.Content>
			<CenteredSpinner label={m['screens.search.results.loading']()} size="_2xl" />
		</Layout.Content>
	);
}

// only promise a retry when one could plausibly help; a rejected query would fail again the same way, and
// telling someone to wait a few minutes for it just wastes their time.
function canRetrySearch(error: unknown) {
	return shouldRetryError(error) || isNetworkError(error);
}

function searchErrorText(error: unknown) {
	return canRetrySearch(error)
		? m['screens.search.results.error.failedRetryable']()
		: m['screens.search.results.error.failed']();
}

function searchRetry(error: unknown, refetch: () => void) {
	return canRetrySearch(error) ? refetch : undefined;
}

function NoResultsText({ query }: { query: string }) {
	return (
		<>
			<Text color="textContrastHigh" size="lg">
				<Trans
					inputs={{ query }}
					markup={{
						t0: ({ children }) => (
							<Text size="lg" weight="medium">
								{children}
							</Text>
						),
					}}
					message={m['screens.search.results.empty']}
				/>
			</Text>
			{'\n\n'}
			<Text color="textContrastHigh" size="md">
				{m['screens.search.results.emptyHint']()}
			</Text>
		</>
	);
}

function PostResults({ query, sort }: { query: string; sort?: 'latest' | 'top' }) {
	const { hasSession } = useSession();

	const normalizedQuery = normalizeSearchQuery(query);

	const {
		data: results,
		error,
		fetchNextPage,
		hasNextPage,
		isFetched,
		isFetching,
		isFetchingNextPage,
		refetch,
	} = useSearchPostsQuery({ query: normalizedQuery, sort });

	const items = uniqueBy(results?.pages.flatMap((page) => page.posts) ?? [], (post) => post.uri);

	const onEndReached = () => {
		if (isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (!hasSession) {
		return (
			<BlankState
				icon={XIcon}
				message={
					<Trans
						markup={{
							t0: ({ children }) => (
								<InlineLinkText
									onPress={() => {
										signinDialogHandle.openWithPayload({});
										return false;
									}}
									to={{ name: 'Explore' }}
								>
									{children}
								</InlineLinkText>
							),
							t1: ({ children }) => <Text>{children}</Text>,
							t2: ({ children }) => <Text color="textContrastMedium">{children}</Text>,
						}}
						message={m['common.search.signInPrompt']}
					/>
				}
				title={m['common.search.loggedOutError']()}
			/>
		);
	}

	if (error) {
		return <ErrorState message={searchErrorText(error)} onRetry={searchRetry(error, () => void refetch())} />;
	}

	if (!isFetched) {
		return <Pending />;
	}

	if (!items.length) {
		return <BlankState icon={MagnifyingGlassIcon} message={<NoResultsText query={query} />} />;
	}

	return (
		<List
			data={items}
			estimateHeight={POST_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			ListFooterComponent={
				<ListTail.Frame>{isFetchingNextPage ? <ListTail.Pending /> : null}</ListTail.Frame>
			}
			onEndReached={onEndReached}
			renderItem={({ index, item }) => <SearchPost position={index} post={item} />}
		/>
	);
}

function SearchPost({ position, post }: { position: number; post: AppBskyFeedDefs.PostView }) {
	// the sticky tab bar already draws the divider above the first row
	return <Post hideTopBorder={position === 0} post={post} />;
}

function UserResults({ query }: { query: string }) {
	const { hasSession } = useSession();

	const {
		data: results,
		error,
		fetchNextPage,
		hasNextPage,
		isFetched,
		isFetching,
		isFetchingNextPage,
		refetch,
	} = useActorSearch({ query });

	const profiles = results?.pages.flatMap((page) => page.actors) ?? [];

	const onEndReached = () => {
		if (!hasSession || isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (error) {
		return <ErrorState message={searchErrorText(error)} onRetry={searchRetry(error, () => void refetch())} />;
	}

	if (!isFetched) {
		return <Pending />;
	}

	if (!profiles.length) {
		return <BlankState icon={MagnifyingGlassIcon} message={<NoResultsText query={query} />} />;
	}

	return (
		<List
			data={profiles}
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.did}
			ListFooterComponent={
				<ListTail.Frame>{isFetchingNextPage ? <ListTail.Pending /> : null}</ListTail.Frame>
			}
			onEndReached={onEndReached}
			// the sticky tab bar already draws the divider above the first row
			renderItem={({ index, item }) => <SearchProfileCard profile={item} topBorder={index !== 0} />}
		/>
	);
}

function SearchProfileCard({ profile, topBorder = true }: { profile: AnyProfileView; topBorder?: boolean }) {
	const moderationOpts = useModerationOpts();
	if (!moderationOpts) {
		return null;
	}
	return <ProfileCard.Default moderationOpts={moderationOpts} profile={profile} topBorder={topBorder} />;
}

function StarterPackResults({ query }: { query: string }) {
	const {
		data: results,
		error,
		fetchNextPage,
		hasNextPage,
		isFetched,
		isFetching,
		isFetchingNextPage,
		refetch,
	} = useStarterPackSearch({ query });

	const starterPacks = results?.pages.flatMap((page) => page.starterPacks) ?? [];

	const onEndReached = () => {
		if (isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (error) {
		return <ErrorState message={searchErrorText(error)} onRetry={searchRetry(error, () => void refetch())} />;
	}

	if (!isFetched) {
		return <Pending />;
	}

	if (!starterPacks.length) {
		return <BlankState icon={MagnifyingGlassIcon} message={<NoResultsText query={query} />} />;
	}

	return (
		<List
			data={starterPacks}
			estimateHeight={STARTER_PACK_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			ListFooterComponent={
				<ListTail.Frame>{isFetchingNextPage ? <ListTail.Pending /> : null}</ListTail.Frame>
			}
			onEndReached={onEndReached}
			// the sticky tab bar already draws the divider above the first row
			renderItem={({ index, item }) => <StarterPackCard.Default starterPack={item} topBorder={index !== 0} />}
		/>
	);
}

function FeedsResults({ query }: { query: string }) {
	const {
		data: results,
		error,
		fetchNextPage,
		hasNextPage,
		isFetched,
		isFetching,
		isFetchingNextPage,
		refetch,
	} = usePopularFeedsSearch({ query });

	const feeds = results?.pages.flatMap((page) => page.feeds) ?? [];

	const onEndReached = () => {
		if (isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (error) {
		return <ErrorState message={searchErrorText(error)} onRetry={searchRetry(error, () => void refetch())} />;
	}

	if (!isFetched) {
		return <Pending />;
	}

	if (!feeds.length) {
		return <BlankState icon={MagnifyingGlassIcon} message={<NoResultsText query={query} />} />;
	}

	return (
		<List
			data={feeds}
			estimateHeight={FEED_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			ListFooterComponent={
				<ListTail.Frame>{isFetchingNextPage ? <ListTail.Pending /> : null}</ListTail.Frame>
			}
			onEndReached={onEndReached}
			// the sticky tab bar already draws the divider above the first row
			renderItem={({ index, item }) => <FeedCard.Default topBorder={index !== 0} view={item} />}
		/>
	);
}
