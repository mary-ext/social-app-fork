import { useMemo } from 'react';
import type { AnyProfileView } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateFeedGenerator } from '@atcute/bluesky-moderation';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { atoms as a, useTheme } from '#/alf';

import * as FeedCard from '#/components/FeedCard';
import { ContentHider } from '#/components/web/moderation/ContentHider';

import type { EmbedType } from '#/types/embed';

import * as css from './index.css';
import type { CommonProps } from './types';

export function FeedEmbed({
	embed,
}: CommonProps & {
	embed: EmbedType<'feed'>;
}) {
	const t = useTheme();
	const view = embed.view;
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
		return moderationOpts ? moderateFeedGenerator(embed.view, moderationOpts) : undefined;
	}, [embed.view, moderationOpts]);
	return (
		<ContentHider
			modui={moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentList) : undefined}
			childContainerClassName={css.revealedPadXs}
		>
			<FeedEmbed embed={embed} />
		</ContentHider>
	);
}
