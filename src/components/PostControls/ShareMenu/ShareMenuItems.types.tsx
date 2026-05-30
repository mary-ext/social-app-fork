import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { type AppBskyFeedDefs, type AppBskyFeedPost, type AppBskyFeedThreadgate } from '@atcute/bluesky';

import { type Richtext } from '#/lib/strings/rich-text-facets';

import { type Shadow } from '#/state/cache/post-shadow';

export interface ShareMenuItemsProps {
	testID: string;
	post: Shadow<AppBskyFeedDefs.PostView>;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	style?: StyleProp<ViewStyle>;
	hitSlop?: PressableProps['hitSlop'];
	size?: 'lg' | 'md' | 'sm';
	timestamp: string;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	onShare: () => void;
}
