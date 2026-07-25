import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ModerationDecision } from '@atcute/bluesky-moderation';

export enum PostEmbedViewContext {
	ChatMessage = 'ChatMessage',
	Feed = 'Feed',
	ThreadHighlighted = 'ThreadHighlighted',
}

export type CommonProps = {
	allowNestedQuotes?: boolean;
	isWithinQuote?: boolean;
	moderation?: ModerationDecision;
	onOpen?: () => void;
	viewContext?: PostEmbedViewContext;
};

export type EmbedProps = CommonProps & {
	embed?: AppBskyFeedDefs.PostView['embed'];
};
