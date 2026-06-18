import { useCallback, useMemo, useState } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HITSLOP_10 } from '#/lib/constants';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { usePostViewTracking } from '#/lib/hooks/usePostViewTracking';
import type { CommonNavigatorParams } from '#/lib/routes/types';
import { shareUrl } from '#/lib/sharing';
import { cleanError } from '#/lib/strings/errors';
import { enforceLen } from '#/lib/strings/helpers';

import { useSearchPostsQuery } from '#/state/queries/search-posts';

import { Post } from '#/view/com/post/Post';
import { List } from '#/view/com/util/List';

import { Button, ButtonIcon } from '#/components/Button';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import * as Layout from '#/components/Layout';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import * as Tabs from '#/components/web/Tabs';

const renderItem = ({ item }: ListRenderItemInfo<AppBskyFeedDefs.PostView>) => {
	return <Post post={item} />;
};

const keyExtractor = (item: AppBskyFeedDefs.PostView, index: number) => {
	return `${item.uri}-${index}`;
};

export default function TopicScreen({ route }: NativeStackScreenProps<CommonNavigatorParams, 'Topic'>) {
	const { topic } = route.params;
	const { t: l } = useLingui();

	const headerTitle = useMemo(() => {
		return enforceLen(topic, 24, true, 'middle');
	}, [topic]);

	const onShare = useCallback(() => {
		const url = new URL('https://bsky.app');
		url.pathname = `/topic/${topic}`;
		void shareUrl(url.toString());
	}, [topic]);

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
						<TopicScreenTab topic={topic} sort={section.sort} active={activeTab === section.id} />
					</Tabs.Panel>
				))}
			</Tabs.Root>
		</Layout.Screen>
	);
}

function TopicScreenTab({ topic, sort, active }: { topic: string; sort: 'top' | 'latest'; active: boolean }) {
	const { t: l } = useLingui();
	const initialNumToRender = useInitialNumToRender();
	const [isPTR, setIsPTR] = useState(false);
	const trackPostView = usePostViewTracking('Topic');

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
	} = useSearchPostsQuery({
		query: topic,
		sort,
		enabled: active,
	});

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

	return (
		<>
			{posts.length < 1 ? (
				<ListMaybePlaceholder
					isLoading={isLoading || !isFetched}
					isError={isError}
					onRetry={refetch}
					emptyType="results"
					emptyMessage={l`We couldn't find any results for that topic.`}
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
