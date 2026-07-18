import type { AppBskyFeedDefs } from '@atcute/bluesky';

import * as FeedCard from '#/components/FeedCard';
import { List } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';

function keyExtractor(item: AppBskyFeedDefs.GeneratorView) {
	return item.uri;
}

interface FeedsListProps {
	feeds: AppBskyFeedDefs.GeneratorView[];
}

export function FeedsList({ feeds }: FeedsListProps) {
	return (
		<List
			data={feeds}
			renderItem={({ index, item }) => <FeedCard.Default view={item} topBorder={index !== 0} />}
			keyExtractor={keyExtractor}
			ListFooterComponent={<ListFooter />}
		/>
	);
}
