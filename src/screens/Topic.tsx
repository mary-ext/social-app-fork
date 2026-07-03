import { useState } from 'react';
import type { ListRenderItemInfo } from 'react-native';

import type { AppBskyFeedDefs } from '@atcute/bluesky';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { HITSLOP_10 } from '#/lib/constants';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
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
import { type Section, Tabs } from '#/components/Tabs';

import { m } from '#/paraglide/messages';

const renderItem = ({ item }: ListRenderItemInfo<AppBskyFeedDefs.PostView>) => {
	return <Post post={item} />;
};

const keyExtractor = (item: AppBskyFeedDefs.PostView, index: number) => {
	return `${item.uri}-${index}`;
};

export default function TopicScreen({ route }: NativeStackScreenProps<CommonNavigatorParams, 'Topic'>) {
	const { topic } = route.params;
	const headerTitle = enforceLen(topic, 24, true, 'middle');

	const onShare = () => {
		const url = new URL('https://bsky.app');
		url.pathname = `/topic/${topic}`;
		void shareUrl(url.toString());
	};

	const [activeTab, setActiveTab] = useState<'latest' | 'top'>('top');

	const sections: Section<'latest' | 'top'>[] = [
		{
			id: 'top',
			label: m['common.search.top'](),
			render: (focused) => <TopicScreenTab topic={topic} sort="top" active={focused} />,
		},
		{
			id: 'latest',
			label: m['common.search.latest'](),
			render: (focused) => <TopicScreenTab topic={topic} sort="latest" active={focused} />,
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

function TopicScreenTab({ topic, sort, active }: { topic: string; sort: 'top' | 'latest'; active: boolean }) {
	const initialNumToRender = useInitialNumToRender();
	const [isPTR, setIsPTR] = useState(false);

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

	return (
		<>
			{posts.length < 1 ? (
				<ListMaybePlaceholder
					isLoading={isLoading || !isFetched}
					isError={isError}
					onRetry={refetch}
					emptyType="results"
					emptyMessage={m['screens.topic.empty']()}
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
