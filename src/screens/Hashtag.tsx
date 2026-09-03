import type { ActorIdentifier } from '@atcute/lexicons';

import { uniqueBy } from '@mary/array-fns';

import { cleanError } from '#/lib/errors';
import { targetToShareUrl } from '#/lib/routes/app-links';
import { enforceLen } from '#/lib/utils/text';

import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { Trans } from '#/locale/Trans';

import { BlankState } from '#/components/BlankState';
import { signinDialogHandle } from '#/components/dialogs/handles';
import { ErrorState } from '#/components/ErrorState';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import { Post } from '#/components/Post/Post';
import { PostFeedLoadingPlaceholder } from '#/components/PostFeed/PostFeedLoadingPlaceholder';
import { SearchError } from '#/components/SearchError';
import { shareUrl } from '#/components/sharing';
import { type Section, Tabs } from '#/components/Tabs';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { InlineButton } from '#/components/web/Link';

import Share from '#/icons/central/ArrowOutOfBox_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export default function HashtagScreen() {
	useTitle(m['navigation.hashtag.title']());

	const [{ tag, author, tab }, replaceParams] = useParams('Hashtag');
	const isCashtag = tag.startsWith('$');

	// Cashtags already include the $ prefix, hashtags need # added
	const fullTag = isCashtag ? tag : `#${tag}`;

	// Keep cashtags uppercase, lowercase hashtags
	const displayTag = isCashtag ? fullTag.toUpperCase() : fullTag.toLowerCase();
	const headerTitle = enforceLen(displayTag, 24, true, 'middle');

	// DIDs have no `@` prefix; handles do.
	const sanitizedAuthor = author ? (author.startsWith('did:') ? author : `@${author}`) : '';

	const onShare = () => {
		void shareUrl(targetToShareUrl({ name: 'Hashtag', author, tag }));
	};

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
				value={tab ?? 'top'}
				onValueChange={(next) => replaceParams({ tab: next })}
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
						<Layout.Header.EndSlot>
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
						</Layout.Header.EndSlot>
					</Layout.Header.Outer>
				}
			/>
		</Layout.Screen>
	);
}

const POST_ITEM_HEIGHT_ESTIMATE = 300;

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

	const { data, isFetchingNextPage, isPending, isError, error, refetch, fetchNextPage } = useSearchPostsQuery(
		{ author, query: queryParam, sort },
	);

	if (!hasSession) {
		return (
			<SearchError title={m['common.search.loggedOutError']()}>
				<Text align="center" leading="snug" size="md">
					<Trans
						message={m['common.search.signInPrompt']}
						markup={{
							t0: ({ children }) => (
								<InlineButton
									label={m['common.session.action.signIn']()}
									onClick={() => signinDialogHandle.openWithPayload({})}
								>
									{children}
								</InlineButton>
							),
							t1: ({ children }) => <Text>{children}</Text>,
							t2: ({ children }) => <Text color="textContrastMedium">{children}</Text>,
						}}
					/>
				</Text>
			</SearchError>
		);
	}

	const posts = uniqueBy(data?.pages.flatMap((page) => page.posts) ?? [], (post) => post.uri);

	if (posts.length < 1) {
		if (isError) {
			return <ErrorState onRetry={() => void refetch()} />;
		}

		if (isPending) {
			return <PostFeedLoadingPlaceholder />;
		}

		return <BlankState icon={MagnifyingGlassIcon} message={m['screens.hashtag.empty']()} />;
	}

	return (
		<List
			data={posts}
			estimateHeight={POST_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={(item) => item.uri}
			renderItem={({ index, item }) => <Post hideTopBorder={index === 0} post={item} />}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			onEndReached={() => {
				if (isError) {
					return;
				}
				void fetchNextPage();
			}}
			onEndReachedThreshold={2}
		/>
	);
}
