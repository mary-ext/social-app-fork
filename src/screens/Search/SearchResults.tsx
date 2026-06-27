import { type ReactNode, useMemo } from 'react';
import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { urls } from '#/lib/constants';
import { definite } from '#/lib/functions';
import { cleanError } from '#/lib/strings/errors';
import { augmentSearchQuery } from '#/lib/strings/helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useActorSearch } from '#/state/queries/actor-search';
import { usePopularFeedsSearch } from '#/state/queries/feed';
import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';

import { Post } from '#/view/com/post/Post';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as FeedCard from '#/components/FeedCard';
import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import { SearchError } from '#/components/SearchError';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import { ExternalInlineLinkText, InlineLinkText } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';
import { type Section, Tabs } from '#/components/web/Tabs';

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
	const { t: l } = useLingui();

	const sections = useMemo(() => {
		if (!queryWithParams) {
			return [];
		}
		const noParams = queryWithParams === query;
		return definite<Section<SearchTabId>>([
			{
				id: 'top',
				label: l`Top`,
				render: (focused) => <PostResults active={focused} query={queryWithParams} sort="top" />,
			},
			{
				id: 'latest',
				label: l`Latest`,
				render: (focused) => <PostResults active={focused} query={queryWithParams} sort="latest" />,
			},
			noParams && {
				id: 'people',
				label: l`People`,
				render: (focused) => <UserResults active={focused} query={query} />,
			},
			noParams && {
				id: 'feeds',
				label: l`Feeds`,
				render: (focused) => <FeedsResults active={focused} query={query} />,
			},
		]);
	}, [l, query, queryWithParams]);

	return (
		<Tabs headerOffset={headerHeight} onValueChange={onTabChange} sections={sections} value={activeTab} />
	);
}

function Pending() {
	const { t: l } = useLingui();
	return (
		<Layout.Content>
			<CenteredSpinner label={l`Loading search results`} size="xl" />
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
							<Text color="textContrastMedium">
								<Trans>Error: {error}</Trans>
							</Text>
						</>
					)}

					{children}
				</div>
			</div>
		</Layout.Content>
	);
}

function NoResultsText({ query }: { query: string }) {
	const { t: l } = useLingui();

	return (
		<>
			<Text color="textContrastHigh" size="lg">
				<Trans>
					No results found for “
					<Text size="lg" weight="medium">
						{query}
					</Text>
					”.
				</Trans>
			</Text>
			{'\n\n'}
			<Text color="textContrastHigh" size="md">
				<Trans context="english-only-resource">
					Try a different search term, or{' '}
					<ExternalInlineLinkText
						href={urls.website.blog.searchTipsAndTricks}
						label={l({
							context: 'english-only-resource',
							message: 'read about how to use search filters',
						})}
						size="md"
					>
						read about how to use search filters
					</ExternalInlineLinkText>
					.
				</Trans>
			</Text>
		</>
	);
}

function PostResults({ active, query, sort }: { active: boolean; query: string; sort?: 'latest' | 'top' }) {
	const { t: l } = useLingui();
	const { currentAccount, hasSession } = useSession();
	const { signinDialogControl } = useGlobalDialogsControlContext();

	const augmentedQuery = useMemo(
		() => augmentSearchQuery(query || '', { did: currentAccount?.did }),
		[query, currentAccount],
	);

	const {
		data: results,
		error,
		fetchNextPage,
		hasNextPage,
		isFetched,
		isFetching,
		isFetchingNextPage,
	} = useSearchPostsQuery({ enabled: active, query: augmentedQuery, sort });

	const items = useMemo(() => {
		const posts = results?.pages.flatMap((page) => page.posts) ?? [];
		const seen = new Set<string>();
		const out: AppBskyFeedDefs.PostView[] = [];
		for (const post of posts) {
			if (seen.has(post.uri)) {
				continue;
			}
			seen.add(post.uri);
			out.push(post);
		}
		return out;
	}, [results]);

	const onEndReached = () => {
		if (isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (!hasSession) {
		return (
			<SearchError title={l`Search is currently unavailable when logged out`}>
				<Text align="center" size="md">
					<Trans>
						<InlineLinkText
							label={l`Sign in`}
							onPress={() => {
								signinDialogControl.openWithPayload({});
								return false;
							}}
							to="/search"
						>
							Sign in
						</InlineLinkText>
						<Text> </Text>
						<Text color="textContrastMedium">
							to search for news, sports, politics, and everything else happening on Bluesky.
						</Text>
					</Trans>
				</Text>
			</SearchError>
		);
	}

	if (error) {
		return (
			<EmptyState
				error={cleanError(error)}
				messageText={l`We’re sorry, but your search could not be completed. Please try again in a few minutes.`}
			/>
		);
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

function UserResults({ active, query }: { active: boolean; query: string }) {
	const { t: l } = useLingui();
	const { hasSession } = useSession();

	const {
		data: results,
		error,
		fetchNextPage,
		hasNextPage,
		isFetched,
		isFetching,
		isFetchingNextPage,
	} = useActorSearch({ enabled: active, query });

	const profiles = useMemo(() => results?.pages.flatMap((page) => page.actors) ?? [], [results]);

	const onEndReached = () => {
		if (!hasSession || isFetching || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	if (error) {
		return (
			<EmptyState
				error={error.toString()}
				messageText={l`We’re sorry, but your search could not be completed. Please try again in a few minutes.`}
			/>
		);
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
	return (
		<div className={css.profileRow({ topBorder })}>
			<ProfileCard.Link profile={profile}>
				<ProfileCard.Outer>
					<ProfileCard.Header>
						<ProfileCard.Avatar moderationOpts={moderationOpts} profile={profile} />
						<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
						<ProfileCard.FollowButton moderationOpts={moderationOpts} profile={profile} />
					</ProfileCard.Header>
					<ProfileCard.Labels moderationOpts={moderationOpts} profile={profile} />
					<ProfileCard.Description profile={profile} />
				</ProfileCard.Outer>
			</ProfileCard.Link>
		</div>
	);
}

function FeedsResults({ active, query }: { active: boolean; query: string }) {
	const { data: results, isFetched } = usePopularFeedsSearch({ enabled: active, query });

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
