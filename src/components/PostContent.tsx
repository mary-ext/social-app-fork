import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import { ClampedPostText } from '#/components/ClampedPostText';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import type { AppModerationCause } from '#/components/Pills';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';

import * as css from './PostContent.css';

/**
 * moderation-gated post body showing alert pills, rich text (with a show-more clamp), and embeds behind a
 * content hider.
 *
 * @param displayContext the display context ('list' or 'view') of the post surface.
 */
function PostContent({
	post,
	richText,
	moderation,
	displayContext,
	additionalCauses,
	ignoreMute,
	onOpenEmbed,
	embedStyle,
}: {
	post: AppBskyFeedDefs.PostView;
	richText: Richtext;
	moderation: ModerationDecision;
	/** Which moderation surface to gate against: the feed list vs. a focused post view. */
	displayContext: 'list' | 'view';
	additionalCauses?: AppModerationCause[];
	ignoreMute?: boolean;
	onOpenEmbed?: () => void;
	/** Style applied to the embed wrapper div. */
	embedStyle?: React.CSSProperties;
}): React.ReactNode {
	const listModui = getDisplayRestrictions(moderation, DisplayContext.ContentList);
	const bodyModui =
		displayContext === 'view' ? getDisplayRestrictions(moderation, DisplayContext.ContentView) : listModui;

	return (
		<ContentHider modui={bodyModui} ignoreMute={ignoreMute} childContainerClassName={css.childContainer}>
			<PostAlerts additionalCauses={additionalCauses} className={css.alerts} modui={bodyModui} />
			{richText.text ? <ClampedPostText authorHandle={post.author.handle} richText={richText} /> : undefined}
			{post.embed ? (
				<div style={embedStyle}>
					<Embed
						embed={post.embed}
						moderation={moderation}
						onOpen={onOpenEmbed}
						viewContext={PostEmbedViewContext.Feed}
					/>
				</div>
			) : null}
		</ContentHider>
	);
}

export { PostContent };
