import type { CSSProperties } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderatePost,
	type ModerationDecision,
} from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { makeProfileLink } from '#/lib/routes/links';
import type { Richtext } from '#/lib/strings/rich-text-facets';

import { POST_TOMBSTONE, type Shadow, usePostShadow } from '#/state/cache/post-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { unstableCacheProfileView } from '#/state/queries/profile';

import { PostMeta } from '#/view/com/util/PostMeta';

import { BlockLink } from '#/components/BlockLink';
import { GalleryBleed, maybeApplyGalleryOffsetStyles } from '#/components/images/Gallery';
import { LabelsOnMyPost } from '#/components/moderation/LabelsOnMe';
import { PostRepliedTo } from '#/components/Post/PostRepliedTo';
import { PostContent } from '#/components/PostContent';
import { PostControls } from '#/components/PostControls';
import { PostOverflowMenuButton } from '#/components/PostControls/PostOverflowMenuButton';
import * as PostLayout from '#/components/PostLayout';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';

import * as css from './Post.css';

export function Post({
	post,
	hideTopBorder,
	style,
	onBeforePress,
}: {
	post: AppBskyFeedDefs.PostView;
	hideTopBorder?: boolean;
	/** Chrome override merged onto the row (e.g. the unread-notification highlight). */
	style?: CSSProperties;
	onBeforePress?: () => void;
}) {
	const moderationOpts = useModerationOpts();
	const record = post.record as AppBskyFeedPost.Main;
	const postShadowed = usePostShadow(post);
	const richText = record
		? {
				text: record.text,
				facets: record.facets,
			}
		: undefined;
	const moderation = moderationOpts ? moderatePost(post, moderationOpts) : undefined;
	if (postShadowed === POST_TOMBSTONE) {
		return null;
	}
	if (record && richText && moderation) {
		return (
			<PostInner
				post={postShadowed}
				record={record}
				richText={richText}
				moderation={moderation}
				hideTopBorder={hideTopBorder}
				style={style}
				onBeforePress={onBeforePress}
			/>
		);
	}
	return null;
}

function PostInner({
	post,
	record,
	richText,
	moderation,
	hideTopBorder,
	style,
	onBeforePress: outerOnBeforePress,
}: {
	post: Shadow<AppBskyFeedDefs.PostView>;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	moderation: ModerationDecision;
	hideTopBorder?: boolean;
	style?: CSSProperties;
	onBeforePress?: () => void;
}) {
	const queryClient = useQueryClient();
	const { openComposer } = useOpenComposer();
	const itemUrip = parseCanonicalResourceUri(post.uri);
	const itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey);
	let replyAuthorDid = '';
	if (record.reply) {
		const urip = parseCanonicalResourceUri(record.reply.parent?.uri || record.reply.root.uri);
		replyAuthorDid = urip.repo;
	}

	const onPressReply = () => {
		openComposer({
			replyTo: {
				uri: post.uri,
				cid: post.cid,
				text: record.text,
				author: post.author,
				embed: post.embed,
				moderation,
				langs: record.langs,
			},
		});
	};

	const onBeforePress = () => {
		unstableCacheProfileView(queryClient, post.author);
		outerOnBeforePress?.();
	};

	const galleryOffsetStyles = maybeApplyGalleryOffsetStyles({
		additionalCauses: [],
		modui: getDisplayRestrictions(moderation, DisplayContext.ContentList),
		post,
	});
	return (
		<GalleryBleed>
			<BlockLink to={itemHref} onBeforePress={onBeforePress}>
				<article className={clsx(css.outer, !hideTopBorder && css.outerBorder)} style={style}>
					<PostLayout.Row>
						<PostLayout.AvatarColumn>
							<PreviewableUserAvatar
								size={36}
								profile={post.author}
								moderation={getDisplayRestrictions(moderation, DisplayContext.ProfileMedia)}
								type={post.author.associated?.labeler ? 'labeler' : 'user'}
								tabIndex={-1}
							/>
						</PostLayout.AvatarColumn>
						<PostLayout.ContentColumn style={galleryOffsetStyles?.meta}>
							<div className={css.metaSpacing}>
								<PostMeta
									author={post.author}
									moderation={moderation}
									timestamp={post.indexedAt}
									postHref={itemHref}
								/>
								<PostOverflowMenuButton post={post} record={record} richText={richText} />
							</div>
							{replyAuthorDid !== '' && (
								<PostRepliedTo parentAuthor={replyAuthorDid} className={css.repliedTo} />
							)}
							<LabelsOnMyPost post={post} />
							<PostContent
								displayContext="view"
								moderation={moderation}
								post={post}
								richText={richText}
								embedStyle={galleryOffsetStyles?.embed}
							/>
							<PostControls post={post} onPressReply={onPressReply} />
						</PostLayout.ContentColumn>
					</PostLayout.Row>
				</article>
			</BlockLink>
		</GalleryBleed>
	);
}
