import { type ListRenderItemInfo, View } from 'react-native';
import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';

import { List } from '#/view/com/util/List';

import { atoms as a, useTheme } from '#/alf';

import * as FeedCard from '#/components/FeedCard';

function keyExtractor(item: AppBskyFeedDefs.GeneratorView) {
	return item.uri;
}

interface FeedsListProps {
	feeds: AppBskyFeedDefs.GeneratorView[];
}

export function FeedsList({ feeds }: FeedsListProps) {
	const bottomBarOffset = useBottomBarOffset(20);
	const t = useTheme();

	const renderItem = ({ item }: ListRenderItemInfo<AppBskyFeedDefs.GeneratorView>) => {
		return (
			<View style={[a.p_lg, a.border_t, t.atoms.border_contrast_low]}>
				<FeedCard.Default view={item} />
			</View>
		);
	};

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
