import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateFeedGenerator } from '@atcute/bluesky-moderation';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import * as FeedCard from '#/components/FeedCard';
import { ContentHider } from '#/components/moderation/ContentHider';

import * as css from './FeedEmbed.css';
import type { CommonProps } from './types';

export function FeedEmbed({
	embed,
}: CommonProps & {
	embed: AppBskyFeedDefs.GeneratorView;
}) {
	const view = embed;
	return (
		<FeedCard.Link className={css.card} view={view}>
			<FeedCard.Outer>
				<FeedCard.Header>
					<FeedCard.Avatar src={view.avatar} size={40} />
					<FeedCard.TitleAndByline title={view.displayName} creator={view.creator} />
				</FeedCard.Header>
			</FeedCard.Outer>
		</FeedCard.Link>
	);
}

export function ModeratedFeedEmbed({
	embed,
}: CommonProps & {
	embed: AppBskyFeedDefs.GeneratorView;
}) {
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts ? moderateFeedGenerator(embed, moderationOpts) : undefined;
	return (
		<ContentHider
			modui={moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentList) : undefined}
			childContainerClassName={css.revealedPad}
		>
			<FeedEmbed embed={embed} />
		</ContentHider>
	);
}
