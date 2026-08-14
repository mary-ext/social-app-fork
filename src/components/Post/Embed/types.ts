import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ModerationDecision } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

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
	postAuthorDid?: Did;
	viewContext?: PostEmbedViewContext;
};

export type EmbedProps = CommonProps & {
	embed?: AppBskyFeedDefs.PostView['embed'];
};
