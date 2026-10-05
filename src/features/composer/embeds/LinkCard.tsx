import { lazy, type ReactNode, Suspense } from 'react';

import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { isGenericUri } from '@atcute/lexicons/syntax';

import type { ResolvedLink } from '#/lib/api/resolve';
import { resolveUrlToLink } from '#/lib/links/app-url';
import { toNiceDomain } from '#/lib/links/nice-domain';
import { getBlobUrl } from '#/lib/utils/blob-url';

import { usePostQuery } from '#/state/queries/post';
import { createEmbedViewRecordFromPost } from '#/state/queries/postgate/util';
import { useResolveLinkQuery } from '#/state/queries/resolve-link';

import { useChatInvite } from '#/components/dms/ChatInvite/use-chat-invite';
import { ExternalEmbed } from '#/components/ExternalEmbed';
import { NavigationDisabled } from '#/components/NavigationDisabled';
import { QuoteEmbed } from '#/components/Post/Embed';
import { ModeratedFeedEmbed } from '#/components/Post/Embed/FeedEmbed';
import { JoinRequestEmbedBody } from '#/components/Post/Embed/JoinRequestEmbed';
import { ModeratedListEmbed } from '#/components/Post/Embed/ListEmbed';
import { isStandardSiteEmbed } from '#/components/Post/Embed/StandardSiteEmbed/utils';
import {
	parseTangledStringUrl,
	type TangledStringTarget,
} from '#/components/Post/Embed/TangledStringEmbed/detect';
import { TangledStringPlaceholder } from '#/components/Post/Embed/TangledStringEmbed/Placeholder';
import { Spinner } from '#/components/Spinner';
import { Embed as StarterPackEmbed } from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import { Button } from '#/components/web/Button';
import * as Skeleton from '#/components/web/Skeleton';

import BanIcon from '#/icons/central/CircleBanSign_round_outlined_radius1_stroke2.svg';
import InfoIcon from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { borderRadius } from '#/styles/tokens.css';

import { useEditor, useIsActivePost } from '../context';
import { PREVIEW_STALE_TIME } from '../open-composer';
import { keepEditorFocus } from '../shared/editor-focus';
import { dismissLinkEmbed, type LinkEmbedKind } from './link-embeds';
import * as css from './LinkCard.css';

const StandardSiteEmbed = lazy(() =>
	import('#/components/Post/Embed/StandardSiteEmbed').then((mod) => ({ default: mod.StandardSiteEmbed })),
);
const TangledStringEmbed = lazy(() =>
	import('#/components/Post/Embed/TangledStringEmbed').then((mod) => ({ default: mod.TangledStringEmbed })),
);

// #region frame

/** `bare` uses the embed's own border; `card` adds one; `notice` frames a status message. */
type FrameVariant = 'bare' | 'card' | 'notice';

type CardKind = LinkEmbedKind | 'quote';

const getFrameLabel = (kind: CardKind, url: string): string => {
	switch (kind) {
		case 'external': {
			return m['view.composer.embed.a11y.linkPreview']({ niceUrl: toNiceDomain(url) });
		}
		case 'quote': {
			return 'Quoted post';
		}
		case 'record': {
			return 'Embedded record';
		}
	}
};

function RemoveButton({
	postId,
	url,
	kind,
	variant,
}: {
	postId: string;
	url: string;
	kind: LinkEmbedKind;
	variant: FrameVariant;
}) {
	const wg = useEditor();
	const isActive = useIsActivePost(postId);
	const isNotice = variant === 'notice';

	const remove = () => {
		dismissLinkEmbed(wg, url);
		// dismissing removes the focused button.
		wg.focus();
	};
	const removeLabel = kind === 'record' ? 'Remove embed' : 'Remove link preview';

	return (
		<div className={isNotice ? css.noticeActions : css.actions} onMouseDown={keepEditorFocus}>
			{isNotice ? (
				<Button
					label={removeLabel}
					size="tiny"
					color="secondary"
					variant="ghost"
					shape="round"
					tabIndex={isActive ? 0 : -1}
					onClick={remove}
				>
					<XIcon className={css.removeIcon} />
				</Button>
			) : (
				<Button
					label={removeLabel}
					className={css.removeButton}
					variant="bare"
					tabIndex={isActive ? 0 : -1}
					onClick={remove}
				>
					<XIcon className={css.removeIcon} />
				</Button>
			)}
		</div>
	);
}

function Frame({
	postId,
	url,
	kind,
	variant,
	children,
}: {
	postId: string;
	url: string;
	kind: CardKind;
	variant: FrameVariant;
	children: ReactNode;
}) {
	return (
		<div className={css.frame[variant]} role="group" aria-label={getFrameLabel(kind, url)}>
			{children}
			{kind !== 'quote' && <RemoveButton postId={postId} url={url} kind={kind} variant={variant} />}
		</div>
	);
}

function Notice({ icon: Icon, message }: { icon: typeof InfoIcon; message: string }) {
	return (
		<div className={css.notice}>
			<Icon className={css.noticeIcon} />
			<Text size="md_sub" weight="semiBold" color="textContrastMedium" numberOfLines={1}>
				{message}
			</Text>
		</div>
	);
}

function NoPreviewNotice() {
	return <Notice icon={InfoIcon} message="No preview for this link" />;
}

function QuoteDisabledNotice() {
	return <Notice icon={BanIcon} message="This post can't be quoted" />;
}

// #endregion

// #region placeholders

function ExternalPlaceholder() {
	return (
		<>
			<div className={css.skeletonThumb} />
			<div className={css.body}>
				<Skeleton.Text size="sm" width="40%" />
				<Skeleton.Text size="md" width="80%" />
				<div className={css.status}>
					<Spinner color="default" label={null} size="sm" />
					<Text size="md_sub" color="textContrastMedium">
						Fetching preview…
					</Text>
				</div>
			</div>
		</>
	);
}

function QuotePlaceholder() {
	return (
		<Skeleton.Col className={css.placeholder} gap="sm">
			<Skeleton.Row align="center" gap="xs">
				<Skeleton.Circle size={16} />
				<Skeleton.Text size="md" width="40%" />
			</Skeleton.Row>
			<Skeleton.Lines count={2} lastWidth={60} />
		</Skeleton.Col>
	);
}

function RecordCardPlaceholder() {
	return (
		<Skeleton.Row className={css.placeholder} align="center" gap="sm">
			<Skeleton.Square radius={borderRadius.sm} size={40} />
			<Skeleton.Col grow>
				<Skeleton.Text size="md" width="60%" />
				<Skeleton.Text color="contrast_25" size="md_sub" width="40%" />
			</Skeleton.Col>
		</Skeleton.Row>
	);
}

function Placeholder({ url }: { url: string }) {
	switch (resolveUrlToLink(url)?.kind) {
		case 'post': {
			return <QuotePlaceholder />;
		}
		case 'bskyStarterPackCode':
		case 'feed':
		case 'list':
		case 'starterPack': {
			return <RecordCardPlaceholder />;
		}
		default: {
			return <ExternalPlaceholder />;
		}
	}
}

// #endregion

// #region resolved

// previews use local thumbnails; uploading is deferred to publishing.
const toViewExternal = (
	link: Extract<ResolvedLink, { type: 'external' }>,
): AppBskyEmbedExternal.ViewExternal | null => {
	if (!isGenericUri(link.uri)) {
		return null;
	}

	const thumb = link.thumb && getBlobUrl(link.thumb);
	return {
		uri: link.uri,
		title: link.title,
		description: link.description,
		thumb: thumb && isGenericUri(thumb) ? thumb : undefined,
	};
};

function RecordPreview({ link }: { link: Extract<ResolvedLink, { type: 'record' }> }) {
	switch (link.kind) {
		case 'post': {
			return <QuoteEmbed embed={createEmbedViewRecordFromPost(link.view)} linkDisabled />;
		}
		case 'feed': {
			return <ModeratedFeedEmbed embed={{ $type: 'app.bsky.feed.defs#generatorView', ...link.view }} />;
		}
		case 'list': {
			return <ModeratedListEmbed embed={{ $type: 'app.bsky.graph.defs#listView', ...link.view }} />;
		}
		case 'starterPack': {
			return <StarterPackEmbed starterPack={link.view} />;
		}
	}
}

// #endregion

type LinkCardProps = {
	postId: string;
	url: string;
	kind: LinkEmbedKind;
};

function ChatInviteCard({ code, ...frame }: LinkCardProps & { code: string }) {
	const { status, preview, action } = useChatInvite({ code });

	if (status === 'error') {
		return (
			<Frame {...frame} variant="notice">
				<NoPreviewNotice />
			</Frame>
		);
	}

	return (
		<Frame {...frame} variant="bare">
			<NavigationDisabled>
				<JoinRequestEmbedBody status={status} preview={preview} action={action} />
			</NavigationDisabled>
		</Frame>
	);
}

function TangledStringCard({ target, ...frame }: LinkCardProps & { target: TangledStringTarget }) {
	// the Tangled record supplies the preview, but publishing needs external metadata.
	const { error } = useResolveLinkQuery(frame.url);

	if (error) {
		return (
			<Frame {...frame} variant="notice">
				<NoPreviewNotice />
			</Frame>
		);
	}

	return (
		<Frame {...frame} variant="bare">
			<NavigationDisabled>
				<Suspense fallback={<TangledStringPlaceholder />}>
					<TangledStringEmbed target={target} />
				</Suspense>
			</NavigationDisabled>
		</Frame>
	);
}

function ResolvedLinkCard(frame: LinkCardProps) {
	const { data, error } = useResolveLinkQuery(frame.url);

	switch (data?.type) {
		case 'external': {
			const view = toViewExternal(data);
			if (!view) {
				return (
					<Frame {...frame} variant="notice">
						<NoPreviewNotice />
					</Frame>
				);
			}

			const external = data.view?.external;
			const card = <ExternalEmbed link={view} hideAlt />;

			return (
				<Frame {...frame} variant="bare">
					<NavigationDisabled>
						{external && isStandardSiteEmbed(external) ? (
							<Suspense fallback={card}>
								<StandardSiteEmbed
									view={{
										...external,
										title: external.title || data.title,
										description: external.description || data.description,
									}}
									preview
								/>
							</Suspense>
						) : (
							card
						)}
					</NavigationDisabled>
				</Frame>
			);
		}
		case 'record': {
			if (data.kind === 'post' && data.view.viewer?.embeddingDisabled) {
				return (
					<Frame {...frame} variant="notice">
						<QuoteDisabledNotice />
					</Frame>
				);
			}

			return (
				<Frame {...frame} variant="bare">
					<NavigationDisabled>
						<RecordPreview link={data} />
					</NavigationDisabled>
				</Frame>
			);
		}
	}

	if (error) {
		// publishing retries failed previews.
		return (
			<Frame {...frame} variant="notice">
				<NoPreviewNotice />
			</Frame>
		);
	}

	return (
		<Frame {...frame} variant="card">
			<Placeholder url={frame.url} />
		</Frame>
	);
}

/**
 * link preview with session-wide dismissal.
 *
 * @param props post id, link URL, and embed slot
 * @returns a preview, loading placeholder, or error notice
 */
export function LinkCard(props: LinkCardProps) {
	const link = resolveUrlToLink(props.url);
	if (link?.kind === 'chatInvite') {
		return <ChatInviteCard {...props} code={link.code} />;
	}

	const tangledTarget = parseTangledStringUrl(props.url);
	if (tangledTarget) {
		return <TangledStringCard {...props} target={tangledTarget} />;
	}

	return <ResolvedLinkCard {...props} />;
}

/**
 * non-removable preview of the thread's quoted post.
 *
 * @param props post id and the quoted post's AT-URI
 * @returns a preview, loading placeholder, or error notice
 */
export function QuoteCard({ postId, uri }: { postId: string; uri: ResourceUri }) {
	const { data, error } = usePostQuery(uri, { staleTime: PREVIEW_STALE_TIME });

	let variant: FrameVariant;
	let content: ReactNode;
	if (data && !data.viewer?.embeddingDisabled) {
		variant = 'bare';
		content = (
			<NavigationDisabled>
				<QuoteEmbed embed={createEmbedViewRecordFromPost(data)} linkDisabled />
			</NavigationDisabled>
		);
	} else if (data) {
		variant = 'notice';
		content = <QuoteDisabledNotice />;
	} else if (error) {
		variant = 'notice';
		content = <NoPreviewNotice />;
	} else {
		variant = 'card';
		content = <QuotePlaceholder />;
	}

	return (
		<Frame postId={postId} url={uri} kind="quote" variant={variant}>
			{content}
		</Frame>
	);
}
