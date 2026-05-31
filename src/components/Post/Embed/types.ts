import { type StyleProp, type ViewStyle } from 'react-native';
import { type AppBskyFeedDefs } from '@atcute/bluesky';
import { type ModerationDecision } from '@atcute/bluesky-moderation';

export enum PostEmbedViewContext {
	ThreadHighlighted = 'ThreadHighlighted',
	Feed = 'Feed',
	FeedEmbedRecordWithMedia = 'FeedEmbedRecordWithMedia',
	ChatMessage = 'ChatMessage',
}

export type CommonProps = {
	moderation?: ModerationDecision;
	onOpen?: () => void;
	style?: StyleProp<ViewStyle>;
	viewContext?: PostEmbedViewContext;
	isWithinQuote?: boolean;
	allowNestedQuotes?: boolean;
};

export type EmbedProps = CommonProps & {
	embed?: AppBskyFeedDefs.PostView['embed'];
};
