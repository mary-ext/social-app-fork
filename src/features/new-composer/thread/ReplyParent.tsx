import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import type { ResourceUri } from '@atcute/lexicons';

import { getPostRecord } from '#/lib/api/record-casts';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { usePostQuery } from '#/state/queries/post';

import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { NavigationDisabled } from '#/components/NavigationDisabled';
import { Embed } from '#/components/Post/Embed';
import { ProfileBadges } from '#/components/ProfileBadges';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';

import { Avatar } from '../post/Avatar';
import * as css from './ReplyParent.css';

/**
 * reply parent preview above the thread.
 *
 * @param props the parent post's AT-URI
 * @returns the parent post preview, an error notice, or null while loading
 */
export function ReplyParent({ uri }: { uri: ResourceUri }) {
	const { data, error } = usePostQuery(uri);

	if (data) {
		return <ParentPost post={data} />;
	}
	if (error) {
		return (
			<div className={css.root}>
				<div className={css.rail}>
					<div className={css.line} />
				</div>
				<Text color="textContrastMedium" size="md">
					Couldn't load the post you're replying to
				</Text>
			</div>
		);
	}
	return null;
}

function ParentPost({ post }: { post: AppBskyFeedDefs.PostView }) {
	const { author, embed } = post;
	const { text, facets } = getPostRecord(post);

	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts ? moderatePost(post, moderationOpts) : undefined;
	const bodyModui = moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentView) : undefined;

	return (
		<article className={css.root} aria-label={`Replying to ${author.handle}`}>
			<div className={css.rail}>
				<Avatar
					profile={author}
					moderation={
						moderation ? getDisplayRestrictions(moderation, DisplayContext.ProfileMedia) : undefined
					}
				/>
				<div className={css.line} />
			</div>

			<div className={css.header}>
				<Text color="textContrastHigh" size="md" weight="semiBold" numberOfLines={1}>
					{author.handle}
				</Text>
				<ProfileBadges className={css.badges} profile={author} size="sm" />
			</div>

			<ContentHider modui={bodyModui}>
				{bodyModui && <PostAlerts className={css.alerts} modui={bodyModui} />}
				{text.trim() && (
					<RichText
						disableLinks
						numberOfLines={20}
						size="md"
						color="textContrastHigh"
						value={{ text, facets }}
					/>
				)}
				{embed && (
					<NavigationDisabled>
						<Embed embed={embed} moderation={moderation} postAuthorDid={author.did} />
					</NavigationDisabled>
				)}
			</ContentHider>
		</article>
	);
}
