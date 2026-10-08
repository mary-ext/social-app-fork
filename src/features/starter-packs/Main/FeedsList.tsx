import type { AppBskyFeedDefs } from '@atcute/bluesky';

import * as FeedCard from '#/components/FeedCard';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';

const FEED_ITEM_HEIGHT_ESTIMATE = 164;

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
			estimateHeight={FEED_ITEM_HEIGHT_ESTIMATE}
			renderItem={({ index, item }) => <FeedCard.Default view={item} topBorder={index !== 0} />}
			keyExtractor={keyExtractor}
			ListFooterComponent={<ListTail.Frame />}
		/>
	);
}
