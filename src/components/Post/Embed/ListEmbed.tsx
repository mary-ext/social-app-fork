import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateList } from '@atcute/bluesky-moderation';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import * as ListCard from '#/components/ListCard';
import { ContentHider } from '#/components/moderation/ContentHider';

import * as css from './ListEmbed.css';
import type { CommonProps } from './types';

export function ListEmbed({
	embed,
}: CommonProps & {
	embed: AppBskyGraphDefs.ListView;
}) {
	const view = embed;
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts ? moderateList(view, moderationOpts) : undefined;
	return (
		<ListCard.Link className={css.card} view={view}>
			<ListCard.Outer>
				<ListCard.Header>
					<ListCard.Avatar src={view.avatar} size={40} />
					<ListCard.TitleAndByline
						creator={view.creator}
						modUi={moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentView) : undefined}
						purpose={view.purpose}
						title={view.name}
					/>
				</ListCard.Header>
				<ListCard.Description description={view.description} />
			</ListCard.Outer>
		</ListCard.Link>
	);
}

export function ModeratedListEmbed({
	embed,
}: CommonProps & {
	embed: AppBskyGraphDefs.ListView;
}) {
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts ? moderateList(embed, moderationOpts) : undefined;
	return (
		<ContentHider
			modui={moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentList) : undefined}
			childContainerClassName={css.revealedPad}
		>
			<ListEmbed embed={embed} />
		</ContentHider>
	);
}
