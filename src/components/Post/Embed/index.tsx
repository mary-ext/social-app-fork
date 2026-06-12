import { useCallback, useMemo } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderatePost } from '@atcute/bluesky-moderation';
import type { $type } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans } from '@lingui/react/macro';
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

import { type Embed as TEmbed, type EmbedType, parseEmbed } from '#/types/embed';

import { ChatInviteEmbed } from './ChatInviteEmbed';
import { ModeratedFeedEmbed } from './FeedEmbed';
import * as css from './index.css';
import { ModeratedListEmbed } from './ListEmbed';
import { PostPlaceholder as PostPlaceholderText } from './PostPlaceholder';
import { StandardSiteEmbed } from './StandardSiteEmbed';
import { isStandardSiteEmbed } from './StandardSiteEmbed/utils';
import type { CommonProps, EmbedProps, PostEmbedViewContext } from './types';
import { VideoEmbed } from './VideoEmbed';

export { PostEmbedViewContext } from './types';

export function Embed({ embed: rawEmbed, ...rest }: EmbedProps) {
	const embed = parseEmbed(rawEmbed);

	switch (embed.type) {
		case 'images':
		case 'gallery':
		case 'link':
		case 'video': {
			return <MediaEmbed embed={embed} {...rest} />;
		}
		case 'feed':
		case 'list':
		case 'starter_pack':
		case 'labeler':
		case 'post':
		case 'post_not_found':
		case 'post_blocked':
		case 'post_detached': {
			return <RecordEmbed embed={embed} {...rest} />;
		}
		case 'post_with_media': {
			return (
				<div className={css.postWithMedia}>
					<MediaEmbed embed={embed.media} {...rest} />
					<RecordEmbed embed={embed.view} {...rest} />
				</div>
			);
		}
		default: {
			return null;
		}
	}
}

function MediaEmbed({
	embed,
	...rest
}: CommonProps & {
	embed: TEmbed;
}) {
	switch (embed.type) {
		case 'images':
		case 'gallery': {
			return (
				<ContentHider
					modui={
						rest.moderation ? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia) : undefined
					}
					activeClassName={css.activeMargin}
				>
					<ImageEmbed embed={embed} {...rest} />
				</ContentHider>
			);
		}
		case 'link': {
			if (isStandardSiteEmbed(embed.view.external)) {
				return (
					<ContentHider
						modui={
							rest.moderation
								? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia)
								: undefined
						}
						activeClassName={css.activeMargin}
					>
						<StandardSiteEmbed
							view={embed.view.external}
							onOpen={rest.onOpen}
							className={css.standardSiteGap}
						/>
					</ContentHider>
				);
			}
			const chatInviteCode = getChatInviteCodeFromUrl(embed.view.external.uri);
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
						<ChatInviteEmbed
							code={chatInviteCode}
							link={embed.view.external}
							onOpen={rest.onOpen}
							style={rest.style}
						/>
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
					<ExternalEmbed link={embed.view.external} onOpen={rest.onOpen} />
				</ContentHider>
			);
		}
		case 'video': {
			return (
				<ContentHider
					modui={
						rest.moderation ? getDisplayRestrictions(rest.moderation, DisplayContext.ContentMedia) : undefined
					}
					activeClassName={css.activeMargin}
				>
					<VideoEmbed embed={embed.view} />
				</ContentHider>
			);
		}
		default: {
			return null;
		}
	}
}

function RecordEmbed({
	embed,
	...rest
}: CommonProps & {
	embed: TEmbed;
}) {
	switch (embed.type) {
		case 'feed': {
			return (
				<div className={css.recordCardGap}>
					<ModeratedFeedEmbed embed={embed} {...rest} />
				</div>
			);
		}
		case 'list': {
			return (
				<div className={css.recordCardGap}>
					<ModeratedListEmbed embed={embed} />
				</div>
			);
		}
		case 'starter_pack': {
			return (
				<div className={css.recordCardGap}>
					<StarterPackCard starterPack={embed.view} />
				</div>
			);
		}
		case 'labeler': {
			// not implemented
			return null;
		}
		case 'post': {
			if (rest.isWithinQuote && !rest.allowNestedQuotes) {
				return null;
			}

			return (
				<QuoteEmbed
					{...rest}
					embed={embed}
					viewContext={rest.viewContext}
					isWithinQuote={rest.isWithinQuote}
					allowNestedQuotes={rest.allowNestedQuotes}
				/>
			);
		}
		case 'post_not_found': {
			return (
				<PostPlaceholderText>
					<Trans>Deleted</Trans>
				</PostPlaceholderText>
			);
		}
		case 'post_blocked': {
			return (
				<PostPlaceholderText>
					<Trans>Blocked</Trans>
				</PostPlaceholderText>
			);
		}
		case 'post_detached': {
			return <PostDetachedEmbed embed={embed} />;
		}
		default: {
			return null;
		}
	}
}

export function PostDetachedEmbed({ embed }: { embed: EmbedType<'post_detached'> }) {
	const { currentAccount } = useSession();
	const isViewerOwner = currentAccount?.did ? embed.view.uri.includes(currentAccount.did) : false;

	return (
		<PostPlaceholderText>
			{isViewerOwner ? <Trans>Removed by you</Trans> : <Trans>Removed by author</Trans>}
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
	embed: EmbedType<'post'>;
	viewContext?: PostEmbedViewContext;
	linkDisabled?: boolean;
}) {
	const moderationOpts = useModerationOpts();
	const quote = useMemo<$type.enforce<AppBskyFeedDefs.PostView>>(
		() =>
			({
				...embed.view,
				$type: 'app.bsky.feed.defs#postView',
				record: embed.view.value,
				embed: embed.view.embeds?.[0],
			}) as unknown as $type.enforce<AppBskyFeedDefs.PostView>,
		[embed],
	);
	const moderation = useMemo(() => {
		return moderationOpts ? moderatePost(quote, moderationOpts) : undefined;
	}, [quote, moderationOpts]);

	const queryClient = useQueryClient();
	const itemUrip = parseCanonicalResourceUri(quote.uri);
	const itemHref = makeProfileLink(quote.author, 'post', itemUrip.rkey);
	const itemTitle = `Post by ${quote.author.handle}`;

	const richText = useMemo(() => {
		const { text, facets } = quote.record as AppBskyFeedPost.Main;
		return text.trim() ? { text, facets } : undefined;
	}, [quote.record]);

	const onBeforePress = useCallback(() => {
		unstableCacheProfileView(queryClient, quote.author);
		onOpen?.();
	}, [queryClient, quote.author, onOpen]);

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
			<div className={css.quoteOuter}>
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
							<BlockLink href={itemHref} label={itemTitle} onBeforePress={onBeforePress}>
								<div className={clsx(css.quoteBody, !active && css.quotePad)}>{contents}</div>
							</BlockLink>
						)
					}
				</ContentHider>
			</div>
		</GalleryBleed>
	);
}
