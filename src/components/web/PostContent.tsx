import { memo, useCallback, useState } from 'react';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import { MAX_POST_LINES } from '#/lib/constants';
import { countLines } from '#/lib/strings/helpers';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { atoms as a } from '#/alf';

import { maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import type { AppModerationCause } from '#/components/Pills';
import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';
import { ShowMoreTextButton } from '#/components/Post/ShowMoreTextButton';
import { ContentHider } from '#/components/web/moderation/ContentHider';
import { RichText } from '#/components/web/RichText';

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
	const [limitLines, setLimitLines] = useState(() => countLines(richText.text) >= MAX_POST_LINES);

	const onPressShowMore = useCallback(() => {
		setLimitLines(false);
	}, []);

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
			{richText.text ? (
				<div className={css.richText}>
					<RichText
						authorHandle={post.author.handle}
						enableTags
						numberOfLines={limitLines ? MAX_POST_LINES : undefined}
						size="md"
						value={richText}
					/>
					{limitLines && <ShowMoreTextButton style={[a.text_md]} onPress={onPressShowMore} />}
				</div>
			) : undefined}
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
PostContent = memo(PostContent);

export { PostContent };
