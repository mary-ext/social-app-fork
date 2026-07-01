import { useState } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HITSLOP_10 } from '#/lib/constants';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import type { CommonNavigatorParams } from '#/lib/routes/types';
import { shareUrl } from '#/lib/sharing';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { enforceLen } from '#/lib/strings/helpers';

import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';

import { Trans } from '#/locale/Trans';

import { Post } from '#/view/com/post/Post';
import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon } from '#/components/Button';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { SearchError } from '#/components/SearchError';
import { type Section, Tabs } from '#/components/Tabs';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

const renderItem = ({ item }: ListRenderItemInfo<AppBskyFeedDefs.PostView>) => {
	return <Post post={item} />;
};

const keyExtractor = (item: AppBskyFeedDefs.PostView, index: number) => {
	return `${item.uri}-${index}`;
};

export default function HashtagScreen({ route }: NativeStackScreenProps<CommonNavigatorParams, 'Hashtag'>) {
	const { tag, author } = route.params;
	const isCashtag = tag.startsWith('$');

	// Cashtags already include the $ prefix, hashtags need # added
	const fullTag = isCashtag ? tag : `#${tag}`;

	// Keep cashtags uppercase, lowercase hashtags
	const displayTag = isCashtag ? fullTag.toUpperCase() : fullTag.toLowerCase();
	const headerTitle = enforceLen(displayTag, 24, true, 'middle');

	// DIDs have no `@` prefix; handles do.
	const sanitizedAuthor = author
		? author.startsWith('did:')
			? sanitizeHandle(author)
			: sanitizeHandle(author, '@')
		: '';

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
			render: (focused) => <HashtagScreenTab fullTag={fullTag} author={author} sort="top" active={focused} />,
		},
		{
			id: 'latest',
			label: m['common.search.latest'](),
			render: (focused) => (
				<HashtagScreenTab fullTag={fullTag} author={author} sort="latest" active={focused} />
			),
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
								label={m['common.share.action.share']()}
								size="small"
								variant="ghost"
								color="primary"
								shape="round"
								onPress={onShare}
								hitSlop={HITSLOP_10}
								style={[{ right: -3 }]}
							>
								<ButtonIcon icon={Share} size="md" />
							</Button>
						</Layout.Header.Slot>
					</Layout.Header.Outer>
				}
			/>
		</Layout.Screen>
	);
}

function HashtagScreenTab({
	fullTag,
	author,
	sort,
	active,
}: {
	fullTag: string;
	author: string | undefined;
	sort: 'top' | 'latest';
	active: boolean;
}) {
	const initialNumToRender = useInitialNumToRender();
	const [isPTR, setIsPTR] = useState(false);
	const t = useTheme();
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
	} = useSearchPostsQuery({ author, enabled: active, query: queryParam, sort });

	const posts = data?.pages.flatMap((page) => page.posts) || [];

	const onRefresh = async () => {
		setIsPTR(true);
		await refetch();
		setIsPTR(false);
	};

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || error) return;
		void fetchNextPage();
	};

	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const showSignIn = () => {
		signinDialogHandle.openWithPayload({});
	};

	if (!hasSession) {
		return (
			<SearchError title={m['common.search.loggedOutError']()}>
				<Text style={[a.text_md, a.text_center, a.leading_snug]}>
					<Trans
						message={m['common.search.signInPrompt']}
						markup={{
							t0: ({ children }) => (
								<InlineLinkText label={m['common.session.action.signIn']()} to={'#'} onPress={showSignIn}>
									{children}
								</InlineLinkText>
							),
							t1: ({ children }) => <Text>{children}</Text>,
							t2: ({ children }) => <Text style={t.atoms.text_contrast_medium}>{children}</Text>,
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
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					refreshing={isPTR}
					onRefresh={() => void onRefresh()}
					onEndReached={onEndReached}
					onEndReachedThreshold={4}
					// @ts-ignore web only -prf
					desktopFixedHeight
					ListFooterComponent={
						<ListFooter
							isFetchingNextPage={isFetchingNextPage}
							error={cleanError(error)}
							onRetry={fetchNextPage}
						/>
					}
					initialNumToRender={initialNumToRender}
					windowSize={11}
				/>
			)}
		</>
	);
}
