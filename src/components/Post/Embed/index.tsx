import {
	unwrapEmbed,
	type AppBskyEmbedRecord,
	type AppBskyFeedDefs,
	type AppBskyFeedPost,
} from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import type { $type } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

import { makeProfileLink } from '#/lib/routes/links';
import { getChatInviteCodeFromUrl } from '#/lib/strings/url-helpers';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { PostMeta } from '#/view/com/util/PostMeta';

import { BlockLink } from '#/components/BlockLink';
import { ExternalEmbed } from '#/components/ExternalEmbed';
import { ImageEmbed } from '#/components/ImageEmbed';
import { GalleryBleed } from '#/components/images/Gallery';
import { ContentHider } from '#/components/moderation/ContentHider';
import { PostAlerts } from '#/components/moderation/PostAlerts';
import { RichText } from '#/components/RichText';
import { Embed as StarterPackCard } from '#/components/StarterPack/StarterPackCard';

import { m } from '#/paraglide/messages';

import { ChatInviteEmbed } from './ChatInviteEmbed';
import { ModeratedFeedEmbed } from './FeedEmbed';
import * as css from './index.css';
import { ModeratedListEmbed } from './ListEmbed';
import { PostPlaceholder as PostPlaceholderText } from './PostPlaceholder';
import { StandardSiteEmbed } from './StandardSiteEmbed';
import { isStandardSiteEmbed } from './StandardSiteEmbed/utils';
import { type CommonProps, type EmbedProps, PostEmbedViewContext } from './types';
import { VideoEmbed } from './VideoEmbed';

export { PostEmbedViewContext } from './types';

export function Embed({ embed: rawEmbed, ...rest }: EmbedProps) {
	const { media, record } = unwrapEmbed(rawEmbed);

	if (media && record) {
		return (
			<div className={css.postWithMedia}>
				<MediaEmbed media={media} {...rest} />
				<RecordEmbed record={record} {...rest} />
			</div>
		);
	}
	if (record) {
		return <RecordEmbed record={record} {...rest} />;
	}
	if (media) {
		return <MediaEmbed media={media} {...rest} />;
	}
	return null;
}

function MediaEmbed({
	media,
	...rest
}: CommonProps & {
	media: NonNullable<ReturnType<typeof unwrapEmbed>['media']>;
}) {
	switch (media.$type) {
		case 'app.bsky.embed.images#view':
		case 'app.bsky.embed.gallery#view': {
			return (
				<ContentHider
					modui={
						rest.moderation ? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia) : undefined
					}
					activeClassName={css.activeMargin}
				>
					<ImageEmbed embed={media} {...rest} />
				</ContentHider>
			);
		}
		case 'app.bsky.embed.external#view': {
			if (isStandardSiteEmbed(media.external)) {
				return (
					<ContentHider
						modui={
							rest.moderation
								? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia)
								: undefined
						}
						activeClassName={css.activeMargin}
					>
						<StandardSiteEmbed view={media.external} onOpen={rest.onOpen} className={css.standardSiteGap} />
					</ContentHider>
				);
			}
			const chatInviteCode = getChatInviteCodeFromUrl(media.external.uri);
			if (chatInviteCode) {
				return (
					<ContentHider
						modui={
							rest.moderation
								? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia)
								: undefined
						}
						activeClassName={css.activeMargin}
					>
						<ChatInviteEmbed code={chatInviteCode} link={media.external} onOpen={rest.onOpen} />
					</ContentHider>
				);
			}
			return (
				<ContentHider
					modui={
						rest.moderation ? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia) : undefined
					}
					activeClassName={css.activeMargin}
				>
					<ExternalEmbed link={media.external} onOpen={rest.onOpen} className={css.externalCardGap} />
				</ContentHider>
			);
		}
		case 'app.bsky.embed.video#view': {
			return (
				<ContentHider
					modui={
						rest.moderation ? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia) : undefined
					}
					activeClassName={css.activeMargin}
				>
					<VideoEmbed embed={media} />
				</ContentHider>
			);
		}
		default: {
			return null;
		}
	}
}

function RecordEmbed({
	record,
	...rest
}: CommonProps & {
	record: NonNullable<ReturnType<typeof unwrapEmbed>['record']>;
}) {
	switch (record.$type) {
		case 'app.bsky.feed.defs#generatorView': {
			return (
				<div className={css.recordCardGap}>
					<ModeratedFeedEmbed embed={record} {...rest} />
				</div>
			);
		}
		case 'app.bsky.graph.defs#listView': {
			return (
				<div className={css.recordCardGap}>
					<ModeratedListEmbed embed={record} />
				</div>
			);
		}
		case 'app.bsky.graph.defs#starterPackViewBasic': {
			return (
				<div className={css.recordCardGap}>
					<StarterPackCard starterPack={record} />
				</div>
			);
		}
		case 'app.bsky.labeler.defs#labelerView': {
			// not implemented
			return null;
		}
		case 'app.bsky.embed.record#viewRecord': {
			if (rest.isWithinQuote && !rest.allowNestedQuotes) {
				return null;
			}

			return (
				<QuoteEmbed
					{...rest}
					embed={record}
					viewContext={rest.viewContext}
					isWithinQuote={rest.isWithinQuote}
					allowNestedQuotes={rest.allowNestedQuotes}
				/>
			);
		}
		case 'app.bsky.embed.record#viewNotFound': {
			return <PostPlaceholderText>{m['components.post.state.deleted']()}</PostPlaceholderText>;
		}
		case 'app.bsky.embed.record#viewBlocked': {
			return <PostPlaceholderText>{m['components.post.state.blocked']()}</PostPlaceholderText>;
		}
		case 'app.bsky.embed.record#viewDetached': {
			return <PostDetachedEmbed embed={record} />;
		}
		default: {
			return null;
		}
	}
}

export function PostDetachedEmbed({ embed }: { embed: AppBskyEmbedRecord.ViewDetached }) {
	const { currentAccount } = useSession();
	const isViewerOwner = currentAccount?.did ? embed.uri.includes(currentAccount.did) : false;

	return (
		<PostPlaceholderText>
			{isViewerOwner
				? m['components.post.state.removedByYou']()
				: m['components.post.state.removedByAuthor']()}
		</PostPlaceholderText>
	);
}

/*
 * Nests parent `Embed` component and therefore must live in this file to avoid
 * circular imports.
 */
export function QuoteEmbed({
	embed,
	onOpen,
	linkDisabled,
	isWithinQuote: parentIsWithinQuote,
	allowNestedQuotes: parentAllowNestedQuotes,
	viewContext,
}: Omit<CommonProps, 'viewContext'> & {
	embed: AppBskyEmbedRecord.ViewRecord;
	viewContext?: PostEmbedViewContext;
	linkDisabled?: boolean;
}) {
	const moderationOpts = useModerationOpts();
	const quote = {
		...embed,
		$type: 'app.bsky.feed.defs#postView',
		record: embed.value,
		embed: embed.embeds?.[0],
	} as unknown as $type.enforce<AppBskyFeedDefs.PostView>;
	const moderation = moderationOpts ? moderatePost(quote, moderationOpts) : undefined;

	const queryClient = useQueryClient();
	const itemUrip = parseCanonicalResourceUri(quote.uri);
	const itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey);
	const itemTitle = `Post by ${quote.author.handle}`;

	const { text, facets } = quote.record as AppBskyFeedPost.Main;
	const richText = text.trim() ? { text, facets } : undefined;

	const onBeforePress = () => {
		unstableCacheProfileView(queryClient, quote.author);
		onOpen?.();
	};

	const contents = (
		<>
			<PostMeta
				author={quote.author}
				className={css.quoteMetaPad}
				moderation={moderation}
				showAvatar
				postHref={itemHref}
				timestamp={quote.indexedAt}
				linkDisabled
			/>
			{moderation ? (
				<PostAlerts
					className={css.postAlerts}
					modui={getDisplayRestrictions(moderation, DisplayContext.ContentView)}
				/>
			) : null}
			{richText ? <RichText disableLinks numberOfLines={20} size="md" value={richText} /> : null}
			{quote.embed && (
				<Embed
					embed={quote.embed}
					moderation={moderation}
					viewContext={viewContext}
					isWithinQuote={parentIsWithinQuote ?? true}
					// already within quote? override nested
					allowNestedQuotes={parentIsWithinQuote ? false : parentAllowNestedQuotes}
				/>
			)}
		</>
	);

	return (
		<GalleryBleed>
			<div
				className={clsx(
					css.quoteOuter,
					viewContext !== PostEmbedViewContext.ChatMessage && css.quoteOuterGap,
				)}
			>
				<ContentHider
					modui={moderation ? getDisplayRestrictions(moderation, DisplayContext.ContentList) : undefined}
					className={clsx(css.quoteCard, !linkDisabled && css.quoteCardHover)}
					activeClassName={css.quoteActive}
					childContainerClassName={css.quoteRevealed}
				>
					{({ active }) =>
						linkDisabled ? (
							<div className={clsx(css.quoteBody, css.quoteBodyDisabled, !active && css.quotePad)}>
								{contents}
							</div>
						) : (
							<BlockLink to={itemHref} label={itemTitle} onBeforePress={onBeforePress}>
								<div className={clsx(css.quoteBody, !active && css.quotePad)}>{contents}</div>
							</BlockLink>
						)
					}
				</ContentHider>
			</div>
		</GalleryBleed>
	);
}
