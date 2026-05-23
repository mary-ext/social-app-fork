import { useMemo } from 'react';
import { type AppBskyFeedDefs, moderateFeedGenerator } from '@atproto/api';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { atoms as a, useTheme } from '#/alf';

import * as FeedCard from '#/components/FeedCard';
import { ContentHider } from '#/components/moderation/ContentHider';

import type * as bsky from '#/types/bsky';
import { type EmbedType } from '#/types/bsky/post';

import { type CommonProps } from './types';

export function FeedEmbed({
	embed,
}: CommonProps & {
	embed: EmbedType<'feed'>;
}) {
	const t = useTheme();
	const view = embed.view as AppBskyFeedDefs.GeneratorView;
	return (
		<FeedCard.Link view={view} style={[a.border, t.atoms.border_contrast_low, a.p_sm, a.rounded_md]}>
			<FeedCard.Outer>
				<FeedCard.Header>
					<FeedCard.Avatar src={view.avatar} size={48} />
					<FeedCard.TitleAndByline
						title={view.displayName}
						creator={view.creator as bsky.profile.AnyProfileView}
					/>
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
		return moderationOpts ? moderateFeedGenerator(embed.view, moderationOpts) : undefined;
	}, [embed.view, moderationOpts]);
	return (
		<ContentHider modui={moderation?.ui('contentList')} childContainerStyle={[a.pt_xs]}>
			<FeedEmbed embed={embed} />
		</ContentHider>
	);
}
