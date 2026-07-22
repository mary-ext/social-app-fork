import { useState } from 'react';

import type { ActorIdentifier } from '@atcute/lexicons';

import { useTitle } from '#/lib/hooks/useTitle';
import { shareUrl } from '#/lib/sharing';
import { cleanError } from '#/lib/strings/errors';
import { enforceLen } from '#/lib/strings/helpers';

import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';

import { Trans } from '#/locale/Trans';

import { Post } from '#/view/com/post/Post';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { SearchError } from '#/components/SearchError';
import { type Section, Tabs } from '#/components/Tabs';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export default function HashtagScreen() {
	useTitle(m['navigation.hashtag.title']());

	const [{ tag, author }] = useParams('Hashtag');
	const isCashtag = tag.startsWith('$');

	// Cashtags already include the $ prefix, hashtags need # added
	const fullTag = isCashtag ? tag : `#${tag}`;

	// Keep cashtags uppercase, lowercase hashtags
	const displayTag = isCashtag ? fullTag.toUpperCase() : fullTag.toLowerCase();
	const headerTitle = enforceLen(displayTag, 24, true, 'middle');

	// DIDs have no `@` prefix; handles do.
	const sanitizedAuthor = author ? (author.startsWith('did:') ? author : `@${author}`) : '';

	const onShare = () => {
		const url = new URL('https://bsky.app');
		url.pathname = `/hashtag/${tag}`;
		if (author) {
			url.searchParams.set('author', author);
		}
		void shareUrl(url.toString());
	};

	const [activeTab, setActiveTab] = useState<'latest' | 'top'>('top');

	const sections: Section<'latest' | 'top'>[] = [
		{
			id: 'top',
			label: m['common.search.top'](),
			children: <HashtagScreenTab author={author} fullTag={fullTag} sort="top" />,
		},
		{
			id: 'latest',
			label: m['common.search.latest'](),
			children: <HashtagScreenTab author={author} fullTag={fullTag} sort="latest" />,
		},
	];

	return (
		<Layout.Screen>
			<Tabs
				sections={sections}
				value={activeTab}
				onValueChange={setActiveTab}
				header={
					<Layout.Header.Outer noBottomBorder sticky={false}>
						<Layout.Header.BackButton />
						<Layout.Header.Content>
							<Layout.Header.TitleText>{headerTitle}</Layout.Header.TitleText>
							{author && (
								<Layout.Header.SubtitleText>
									{m['screens.hashtag.fromAuthor']({ author: sanitizedAuthor })}
								</Layout.Header.SubtitleText>
							)}
						</Layout.Header.Content>
						<Layout.Header.Slot>
							<Button
								color="primary"
								label={m['common.share.action.share']()}
								onClick={onShare}
								shape="round"
								size="small"
								variant="ghost"
							>
								<ButtonIcon icon={Share} />
							</Button>
						</Layout.Header.Slot>
					</Layout.Header.Outer>
				}
			/>
		</Layout.Screen>
	);
}

function HashtagScreenTab({
	author,
	fullTag,
	sort,
}: {
	author: ActorIdentifier | undefined;
	fullTag: string;
	sort: 'top' | 'latest';
}) {
	const { hasSession } = useSession();

	const isCashtag = fullTag.startsWith('$');

	// Cashtags need # prefix for search: "#$BTC"
	const queryParam = isCashtag ? `#${fullTag}` : fullTag;

	const {
		data,
		isFetched,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
	} = useSearchPostsQuery({ author, query: queryParam, sort });

	const posts = data?.pages.flatMap((page) => page.posts) || [];

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const showSignIn = () => {
		signinDialogHandle.openWithPayload({});
	};

	if (!hasSession) {
		return (
			<SearchError title={m['common.search.loggedOutError']()}>
				<Text align="center" leading="snug" size="md">
					<Trans
						message={m['common.search.signInPrompt']}
						markup={{
							t0: ({ children }) => (
								<InlineLinkText label={m['common.session.action.signIn']()} to={'#'} onPress={showSignIn}>
									{children}
								</InlineLinkText>
							),
							t1: ({ children }) => <Text>{children}</Text>,
							t2: ({ children }) => <Text color="textContrastMedium">{children}</Text>,
						}}
					/>
				</Text>
			</SearchError>
		);
	}

	return (
		<>
			{posts.length < 1 ? (
				<ListMaybePlaceholder
					isLoading={isLoading || !isFetched}
					isError={isError}
					onRetry={refetch}
					emptyType="results"
					emptyMessage={m['screens.hashtag.empty']()}
				/>
			) : (
				<List
					data={posts}
					keyExtractor={(item, index) => `${item.uri}-${index}`}
					renderItem={({ index, item }) => <Post hideTopBorder={index === 0} post={item} />}
					onEndReached={onEndReached}
					onEndReachedThreshold={4}
					ListFooterComponent={
						<ListFooter
							isFetchingNextPage={isFetchingNextPage}
							error={cleanError(error)}
							onRetry={fetchNextPage}
						/>
					}
				/>
			)}
		</>
	);
}
