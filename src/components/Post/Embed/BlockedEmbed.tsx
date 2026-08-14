import type { AppBskyEmbedRecord, AppBskyGraphDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { postUriToTarget } from '#/lib/routes/targets';

import { useRelationshipQuery } from '#/state/queries/relationship';

import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import { PostPlaceholder } from './PostPlaceholder';

const getViewerBlockLabel = (author: AppBskyEmbedRecord.ViewBlocked['author']) => {
	if (author.viewer?.blocking) {
		return m['components.post.state.blockedByYou']();
	}
	if (author.viewer?.blockedBy) {
		return m['components.post.state.blocksYou']();
	}

	return undefined;
};

const getPosterBlockLabel = (relationship: AppBskyGraphDefs.Relationship | undefined) => {
	if (relationship?.blocking || relationship?.blockingByList) {
		return m['components.post.state.blockedByPoster']();
	}
	if (relationship?.blockedBy || relationship?.blockedByList) {
		return m['components.post.state.blocksPoster']();
	}

	return m['components.post.state.blocked']();
};

export function BlockedEmbed({
	embed,
	postAuthorDid,
}: {
	embed: AppBskyEmbedRecord.ViewBlocked;
	postAuthorDid?: Did;
}) {
	const viewerLabel = getViewerBlockLabel(embed.author);

	const { data: relationship } = useRelationshipQuery({
		actor: viewerLabel ? undefined : postAuthorDid,
		other: embed.author.did,
	});

	return (
		<PostPlaceholder
			trailing={
				viewerLabel ? undefined : (
					<InlineLinkText
						label={m['components.post.state.a11y.view']()}
						size="md"
						to={postUriToTarget(embed.uri)}
						weight="medium"
					>
						{m['components.post.state.action.view']()}
					</InlineLinkText>
				)
			}
		>
			{viewerLabel ?? getPosterBlockLabel(relationship)}
		</PostPlaceholder>
	);
}
