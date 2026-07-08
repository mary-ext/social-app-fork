import type { ReactNode } from 'react';

import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';

import { urls } from '#/lib/constants';
import { definite } from '#/lib/functions';
import { cleanError } from '#/lib/strings/errors';
import { augmentSearchQuery } from '#/lib/strings/helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorSearch } from '#/state/queries/actor-search';
import { usePopularFeedsSearch } from '#/state/queries/feed';
import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';

import { Trans } from '#/locale/Trans';

import { Post } from '#/view/com/post/Post';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import * as FeedCard from '#/components/FeedCard';
import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import { SearchError } from '#/components/SearchError';
import { type Section, Tabs } from '#/components/Tabs';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import { ExternalInlineLinkText, InlineLinkText } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

import * as css from './SearchResults.css';

export type SearchTabId = 'feeds' | 'latest' | 'people' | 'top';

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
		]);
	}

	return (
		<Tabs headerOffset={headerHeight} onValueChange={onTabChange} sections={sections} value={activeTab} />
	);
}

function Pending() {
	return (
		<Layout.Content>
			<CenteredSpinner label={m['screens.search.results.loading']()} size="2xl" />
		</Layout.Content>
	);
}

function EmptyState({
	children,
	error,
	messageText,
}: {
	children?: ReactNode;
	error?: string;
	messageText: ReactNode;
}) {
	return (
		<Layout.Content>
			<div className={css.emptyOuter}>
				<div className={css.emptyBox}>
					<Text size="md">{messageText}</Text>

					{error && (
						<>
							<div className={css.emptyDivider} />
							<Text color="textContrastMedium">{m['screens.search.results.error.generic']({ error })}</Text>
						</>
					)}

					{children}
				</div>
			</div>
		</Layout.Content>
	);
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
				<Trans
					markup={{
						t0: ({ children }) => (
							<ExternalInlineLinkText href={urls.website.blog.searchTipsAndTricks} size="md">
								{children}
							</ExternalInlineLinkText>
						),
					}}
					message={m['screens.search.results.emptyHint']}
				/>
			</Text>
		</>
	);
}

function PostResults({ query, sort }: { query: string; sort?: 'latest' | 'top' }) {
	const { currentAccount, hasSession } = useSession();
	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const augmentedQuery = augmentSearchQuery(query || '', { did: currentAccount?.did });

	const {
		data: results,
		error,
		fetchNextPage,
		hasNextPage,
		isFetched,
		isFetching,
		isFetchingNextPage,
	} = useSearchPostsQuery({ query: augmentedQuery, sort });

	const posts = results?.pages.flatMap((page) => page.posts) ?? [];
	const seen = new Set<string>();
	const items: AppBskyFeedDefs.PostView[] = [];
	for (const post of posts) {
		if (seen.has(post.uri)) {
			continue;
		}
		seen.add(post.uri);
		items.push(post);
	}

	const onEndReached = () => {
		if (isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (!hasSession) {
		return (
			<SearchError title={m['common.search.loggedOutError']()}>
				<Text align="center" size="md">
					<Trans
						markup={{
							t0: ({ children }) => (
								<InlineLinkText
									onPress={() => {
										signinDialogHandle.openWithPayload({});
										return false;
									}}
									to="/search"
								>
									{children}
								</InlineLinkText>
							),
							t1: ({ children }) => <Text>{children}</Text>,
							t2: ({ children }) => <Text color="textContrastMedium">{children}</Text>,
						}}
						message={m['common.search.signInPrompt']}
					/>
				</Text>
			</SearchError>
		);
	}

	if (error) {
		return <EmptyState error={cleanError(error)} messageText={m['screens.search.results.error.failed']()} />;
	}

	if (!isFetched) {
		return <Pending />;
	}

	if (!items.length) {
		return <EmptyState messageText={<NoResultsText query={query} />} />;
	}

	return (
		<List
			data={items}
			keyExtractor={(item) => item.uri}
			ListFooterComponent={<ListFooter hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} />}
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
	} = useActorSearch({ query });

	const profiles = results?.pages.flatMap((page) => page.actors) ?? [];

	const onEndReached = () => {
		if (!hasSession || isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (error) {
		return <EmptyState error={error.toString()} messageText={m['screens.search.results.error.failed']()} />;
	}

	if (!isFetched) {
		return <Pending />;
	}

	if (!profiles.length) {
		return <EmptyState messageText={<NoResultsText query={query} />} />;
	}

	return (
		<List
			data={profiles}
			keyExtractor={(item) => item.did}
			ListFooterComponent={
				<ListFooter hasNextPage={hasNextPage && hasSession} isFetchingNextPage={isFetchingNextPage} />
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

function FeedsResults({ query }: { query: string }) {
	const { data: results, isFetched } = usePopularFeedsSearch({ query });

	if (!isFetched || !results) {
		return <Pending />;
	}

	if (!results.length) {
		return <EmptyState messageText={<NoResultsText query={query} />} />;
	}

	return (
		<List
			data={results}
			keyExtractor={(item) => item.uri}
			ListFooterComponent={<ListFooter />}
			// the sticky tab bar already draws the divider above the first row
			renderItem={({ index, item }) => <FeedCard.Default topBorder={index !== 0} view={item} />}
		/>
	);
}
