import { useState } from 'react';

import { useTitle } from '#/lib/hooks/useTitle';
import { shareUrl } from '#/lib/sharing';
import { cleanError } from '#/lib/strings/errors';
import { enforceLen } from '#/lib/strings/helpers';

import { useSearchPostsQuery } from '#/state/queries/search-posts';

import { Post } from '#/view/com/post/Post';

import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share } from '#/components/icons/ArrowOutOfBox';
import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { type Section, Tabs } from '#/components/Tabs';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export default function TopicScreen() {
	const [{ topic }] = useParams('Topic');
	useTitle(m['navigation.topic.title']());
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
			children: <TopicScreenTab topic={topic} sort="top" />,
		},
		{
			id: 'latest',
			label: m['common.search.latest'](),
			children: <TopicScreenTab topic={topic} sort="latest" />,
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

function TopicScreenTab({ topic, sort }: { topic: string; sort: 'top' | 'latest' }) {
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
	});

	const posts = data?.pages.flatMap((page) => page.posts) || [];

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || error) {
			return;
		}
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
