import { cleanError } from '#/lib/errors';
import { targetToShareUrl } from '#/lib/routes/app-links';
import { enforceLen } from '#/lib/utils/text';

import { useSearchPostsQuery } from '#/state/queries/search-posts';
import { useTitle } from '#/state/use-title';

import { List } from '#/components/List/List';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { Post } from '#/components/Post/Post';
import { shareUrl } from '#/components/sharing';
import { type Section, Tabs } from '#/components/Tabs';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import Share from '#/icons/central/ArrowOutOfBox_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export default function TopicScreen() {
	const [{ tab, topic }, replaceParams] = useParams('Topic');
	useTitle(m['navigation.topic.title']());
	const headerTitle = enforceLen(topic, 24, true, 'middle');

	const onShare = () => {
		void shareUrl(targetToShareUrl({ name: 'Topic', topic }));
	};

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
				value={tab ?? 'top'}
				onValueChange={(next) => replaceParams({ tab: next })}
				header={
					<Layout.Header.Outer noBottomBorder sticky={false}>
						<Layout.Header.BackButton />
						<Layout.Header.Content>
							<Layout.Header.TitleText>{headerTitle}</Layout.Header.TitleText>
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
					estimateHeight={POST_ITEM_HEIGHT_ESTIMATE}
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
