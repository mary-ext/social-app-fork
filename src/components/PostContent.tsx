import type { CSSProperties, ReactNode } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import type { AppModerationCause } from '#/lib/moderation/causes';
import type { Richtext } from '#/lib/rich-text';

import type { PostNumbering } from '#/state/queries/feed-tuner';

import { ClampedPostText } from '#/components/ClampedPostText';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { PostNumberBlock } from '#/components/PostNumber';

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
	postNumbering,
	moderation,
	displayContext,
	additionalCauses,
	ignoreMute,
	onOpenEmbed,
	embedStyle,
}: {
	post: AppBskyFeedDefs.PostView;
	richText: Richtext;
	postNumbering?: PostNumbering;
	moderation: ModerationDecision;
	/** Which moderation surface to gate against: the feed list vs. a focused post view. */
	displayContext: 'list' | 'view';
	additionalCauses?: AppModerationCause[];
	ignoreMute?: boolean;
	onOpenEmbed?: () => void;
	/** Style applied to the embed wrapper div. */
	embedStyle?: CSSProperties;
}): ReactNode {
	const listModui = getDisplayRestrictions(moderation, DisplayContext.ContentList);
	const bodyModui =
		displayContext === 'view' ? getDisplayRestrictions(moderation, DisplayContext.ContentView) : listModui;

	let text: ReactNode;
	if (richText.text) {
		text = (
			<ClampedPostText authorHandle={post.author.handle} postNumbering={postNumbering} richText={richText} />
		);
	} else if (postNumbering) {
		text = <PostNumberBlock value={postNumbering} />;
	}

	return (
		<ContentHider modui={bodyModui} ignoreMute={ignoreMute} childContainerClassName={css.childContainer}>
			<PostAlerts additionalCauses={additionalCauses} className={css.alerts} modui={bodyModui} />
			{text}
			{post.embed ? (
				<div style={embedStyle}>
					<Embed
						embed={post.embed}
						moderation={moderation}
						onOpen={onOpenEmbed}
						postAuthorDid={post.author.did}
						viewContext={PostEmbedViewContext.Feed}
					/>
				</div>
			) : null}
		</ContentHider>
	);
}

export { PostContent };
