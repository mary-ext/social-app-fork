import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import { ClampedPostText } from '#/components/ClampedPostText';
import { maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import type { AppModerationCause } from '#/components/Pills';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';

import * as css from './PostContent.css';

/**
 * The moderation-gated post body: alert pills, rich text (with a show-more clamp), and the embed, all behind
 * a `ContentHider`. Shared by the feed (`displayContext='list'`) and standalone (`'view'`) post surfaces.
 *
 * The gate + alerts moderate against the surface's own display context; the embed's gallery offset always
 * uses the list context, matching both call sites.
 */
let PostContent = ({
	post,
	richText,
	moderation,
	displayContext,
	additionalCauses,
	ignoreMute,
	onOpenEmbed,
	className,
	embedClassName,
}: {
	post: AppBskyFeedDefs.PostView;
	richText: Richtext;
	moderation: ModerationDecision;
	/** Which moderation surface to gate against: the feed list vs. a focused post view. */
	displayContext: 'list' | 'view';
	additionalCauses?: AppModerationCause[];
	ignoreMute?: boolean;
	onOpenEmbed?: () => void;
	/** Forwarded to the `ContentHider` (e.g. the standalone surface's trailing margin). */
	className?: string;
	/** Forwarded to the embed wrapper (e.g. the feed surface's trailing padding). */
	embedClassName?: string;
}): React.ReactNode => {
	const listModui = getDisplayRestrictions(moderation, DisplayContext.ContentList);
	const bodyModui =
		displayContext === 'view' ? getDisplayRestrictions(moderation, DisplayContext.ContentView) : listModui;

	return (
		<ContentHider
			modui={bodyModui}
			ignoreMute={ignoreMute}
			className={className}
			childContainerClassName={css.childContainer}
		>
			<PostAlerts additionalCauses={additionalCauses} className={css.alerts} modui={bodyModui} />
			{richText.text ? <ClampedPostText authorHandle={post.author.handle} richText={richText} /> : undefined}
			{post.embed ? (
				<div
					className={embedClassName}
					style={maybeApplyGalleryOffsetStyles('embed', {
						post,
						modui: listModui,
						additionalCauses,
					})}
				>
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
};

export { PostContent };
