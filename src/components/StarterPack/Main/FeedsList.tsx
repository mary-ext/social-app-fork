import { type ListRenderItemInfo, View } from 'react-native';

import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';

import { List } from '#/view/com/util/List';

import * as FeedCard from '#/components/FeedCard';

function keyExtractor(item: AppBskyFeedDefs.GeneratorView) {
	return item.uri;
}

function renderItem({ item }: ListRenderItemInfo<AppBskyFeedDefs.GeneratorView>) {
	return <FeedCard.Default view={item} />;
}

interface FeedsListProps {
	feeds: AppBskyFeedDefs.GeneratorView[];
}

export function FeedsList({ feeds }: FeedsListProps) {
	const bottomBarOffset = useBottomBarOffset(20);

	return (
		<List
			data={feeds}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			ListFooterComponent={<View style={[{ height: bottomBarOffset }]} />}
			showsVerticalScrollIndicator={false}
			desktopFixedHeight={true}
		/>
	);
}
