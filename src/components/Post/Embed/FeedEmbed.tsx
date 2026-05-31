import { useMemo } from 'react';
import { type AnyProfileView, type AppBskyFeedDefs } from '@atcute/bluesky';

import { moderateFeedGenerator } from '#/lib/moderation/compat';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { atoms as a, useTheme } from '#/alf';

import * as FeedCard from '#/components/FeedCard';
import { ContentHider } from '#/components/moderation/ContentHider';

import { type EmbedType } from '#/types/bsky/post';

import { type CommonProps } from './types';

export function FeedEmbed({
	embed,
}: CommonProps & {
	embed: EmbedType<'feed'>;
}) {
	const t = useTheme();
	// TODO(atcute Phase 5.2): drop cast once #/types/bsky/post flips to @atcute
	const view = embed.view as unknown as AppBskyFeedDefs.GeneratorView;
	return (
		<FeedCard.Link view={view} style={[a.border, t.atoms.border_contrast_low, a.p_sm, a.rounded_md]}>
			<FeedCard.Outer>
				<FeedCard.Header>
					<FeedCard.Avatar src={view.avatar} size={48} />
					<FeedCard.TitleAndByline title={view.displayName} creator={view.creator as AnyProfileView} />
				</FeedCard.Header>
			</FeedCard.Outer>
		</FeedCard.Link>
	);
}

export function ModeratedFeedEmbed({
	embed,
}: CommonProps & {
	embed: EmbedType<'feed'>;
}) {
	const moderationOpts = useModerationOpts();
	const moderation = useMemo(() => {
		return moderationOpts
			? // TODO(atcute Phase 5.2): drop cast once #/types/bsky/post flips to @atcute
				moderateFeedGenerator(embed.view as unknown as AppBskyFeedDefs.GeneratorView, moderationOpts)
			: undefined;
	}, [embed.view, moderationOpts]);
	return (
		<ContentHider modui={moderation?.ui('contentList')} childContainerStyle={[a.pt_xs]}>
			<FeedEmbed embed={embed} />
		</ContentHider>
	);
}
