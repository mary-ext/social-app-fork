import { useCallback, useMemo, useState } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { Trans } from '@lingui/react/macro';
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
import { type Section, Tabs } from '#/components/web/Tabs';

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

	const sections = useMemo<Section<'latest' | 'top'>[]>(() => {
		return [
			{
				id: 'top',
				label: m['common.label.top'](),
				render: (focused) => (
					<HashtagScreenTab fullTag={fullTag} author={author} sort="top" active={focused} />
				),
			},
			{
				id: 'latest',
				label: m['common.label.latest'](),
				render: (focused) => (
					<HashtagScreenTab fullTag={fullTag} author={author} sort="latest" active={focused} />
				),
			},
		];
	}, [fullTag, author]);

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
									{m['screens.hashtag.label.fromAuthor']({ sanitizedAuthor })}
								</Layout.Header.SubtitleText>
							)}
						</Layout.Header.Content>
						<Layout.Header.Slot>
							<Button
								label={m['common.action.share']()}
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

	const { signinDialogControl } = useGlobalDialogsControlContext();

	const showSignIn = () => {
		signinDialogControl.openWithPayload({});
	};

	if (!hasSession) {
		return (
			<SearchError title={m['common.error.searchLoggedOut']()}>
				<Text style={[a.text_md, a.text_center, a.leading_snug]}>
					<Trans>
						<InlineLinkText label={m['common.action.signIn']()} to={'#'} onPress={showSignIn}>
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
					emptyMessage={m['screens.hashtag.empty.noResults']()}
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
