import { useCallback, useMemo, useState } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HITSLOP_10 } from '#/lib/constants';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import type { CommonNavigatorParams } from '#/lib/routes/types';
import { shareUrl } from '#/lib/sharing';
import { cleanError } from '#/lib/strings/errors';
import { sanitizeHandle } from '#/lib/strings/handles';
import { enforceLen } from '#/lib/strings/helpers';

import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useSession } from '#/state/session';
import { useCloseAllActiveElements } from '#/state/util';

import { Post } from '#/view/com/post/Post';
import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon } from '#/components/Button';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import * as Layout from '#/components/Layout';
import { InlineLinkText } from '#/components/Link';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { SearchError } from '#/components/SearchError';
import { Text } from '#/components/Typography';
import * as Tabs from '#/components/web/Tabs';

const renderItem = ({ item }: ListRenderItemInfo<AppBskyFeedDefs.PostView>) => {
	return <Post post={item} />;
};

const keyExtractor = (item: AppBskyFeedDefs.PostView, index: number) => {
	return `${item.uri}-${index}`;
};

export default function HashtagScreen({ route }: NativeStackScreenProps<CommonNavigatorParams, 'Hashtag'>) {
	const { tag, author } = route.params;
	const { t: l } = useLingui();

	const isCashtag = tag.startsWith('$');

	const fullTag = useMemo(() => {
		// Cashtags already include the $ prefix, hashtags need # added
		return isCashtag ? tag : `#${tag}`;
	}, [tag, isCashtag]);

	const headerTitle = useMemo(() => {
		// Keep cashtags uppercase, lowercase hashtags
		const displayTag = isCashtag ? fullTag.toUpperCase() : fullTag.toLowerCase();
		return enforceLen(displayTag, 24, true, 'middle');
	}, [fullTag, isCashtag]);

	const sanitizedAuthor = useMemo(() => {
		if (!author) return '';
		return sanitizeHandle(author);
	}, [author]);

	const onShare = useCallback(() => {
		const url = new URL('https://bsky.app');
		url.pathname = `/hashtag/${tag}`;
		if (author) {
			url.searchParams.set('author', author);
		}
		void shareUrl(url.toString());
	}, [tag, author]);

	const [activeTab, setActiveTab] = useState<'latest' | 'top'>('top');

	const sections = useMemo(() => {
		return [
			{ id: 'top' as const, sort: 'top' as const, title: l`Top` },
			{ id: 'latest' as const, sort: 'latest' as const, title: l`Latest` },
		];
	}, [l]);

	return (
		<Layout.Screen>
			<Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as 'latest' | 'top')}>
				<Layout.Header.Outer noBottomBorder sticky={false}>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{headerTitle}</Layout.Header.TitleText>
						{author && <Layout.Header.SubtitleText>{l`From @${sanitizedAuthor}`}</Layout.Header.SubtitleText>}
					</Layout.Header.Content>
					<Layout.Header.Slot>
						<Button
							label={l`Share`}
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
				<Tabs.List>
					{sections.map((section) => (
						<Tabs.Tab
							key={section.id}
							label={section.title}
							value={section.id}
							onClick={() => {
								if (activeTab === section.id) {
									window.scrollTo(0, 0);
								}
							}}
						/>
					))}
				</Tabs.List>
				{sections.map((section) => (
					<Tabs.Panel key={section.id} value={section.id}>
						<HashtagScreenTab
							fullTag={fullTag}
							author={author}
							sort={section.sort}
							active={activeTab === section.id}
						/>
					</Tabs.Panel>
				))}
			</Tabs.Root>
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
	const { t: l } = useLingui();
	const initialNumToRender = useInitialNumToRender();
	const [isPTR, setIsPTR] = useState(false);
	const t = useTheme();
	const { hasSession } = useSession();
	const trackPostView = usePostViewTracking('Hashtag');

	const isCashtag = fullTag.startsWith('$');

	const queryParam = useMemo(() => {
		// Cashtags need # prefix for search: "#$BTC" or "#$BTC from:author"
		const searchTag = isCashtag ? `#${fullTag}` : fullTag;
		if (!author) return searchTag;
		return `${searchTag} from:${author}`;
	}, [fullTag, author, isCashtag]);

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
	} = useSearchPostsQuery({ query: queryParam, sort, enabled: active });

	const posts = useMemo(() => {
		return data?.pages.flatMap((page) => page.posts) || [];
	}, [data]);

	const onRefresh = useCallback(async () => {
		setIsPTR(true);
		await refetch();
		setIsPTR(false);
	}, [refetch]);

	const onEndReached = useCallback(() => {
		if (isFetchingNextPage || !hasNextPage || error) return;
		void fetchNextPage();
	}, [isFetchingNextPage, hasNextPage, error, fetchNextPage]);

	const closeAllActiveElements = useCloseAllActiveElements();
	const { signinDialogControl } = useGlobalDialogsControlContext();

	const showSignIn = () => {
		closeAllActiveElements();
		signinDialogControl.open({});
	};

	if (!hasSession) {
		return (
			<SearchError title={l`Search is currently unavailable when logged out`}>
				<Text style={[a.text_md, a.text_center, a.leading_snug]}>
					<Trans>
						<InlineLinkText label={l`Sign in`} to={'#'} onPress={showSignIn}>
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

	return (
		<>
			{posts.length < 1 ? (
				<ListMaybePlaceholder
					isLoading={isLoading || !isFetched}
					isError={isError}
					onRetry={refetch}
					emptyType="results"
					emptyMessage={l`We couldn't find any results for that tag.`}
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
					onItemSeen={trackPostView}
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
