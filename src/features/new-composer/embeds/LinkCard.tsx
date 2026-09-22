import { lazy, type ReactNode, Suspense } from 'react';

import type { AppBskyEmbedExternal } from '@atcute/bluesky';
import { isGenericUri } from '@atcute/lexicons/syntax';

import type { Wordgard } from 'wordgard/editor';

import { EmbeddingDisabledError, type ResolvedLink } from '#/lib/api/resolve';
import { resolveUrlToLink } from '#/lib/links/app-url';
import { toNiceDomain } from '#/lib/links/nice-domain';
import { getBlobUrl } from '#/lib/utils/blob-url';

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
import { Spinner } from '#/components/Spinner';
import { Embed as StarterPackEmbed } from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Skeleton from '#/components/web/Skeleton';

import BanIcon from '#/icons/central/CircleBanSign_round_outlined_radius1_stroke2.svg';
import InfoIcon from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { borderRadius } from '#/styles/tokens.css';

import { keepEditorFocus } from '../focus';
import { dismissLinkEmbed, type LinkEmbedKind } from './link-embeds';
import * as styles from './LinkCard.css';

const StandardSiteEmbed = lazy(() =>
	import('#/components/Post/Embed/StandardSiteEmbed').then((mod) => ({ default: mod.StandardSiteEmbed })),
);

// #region frame

/**
 * `bare` uses the embed's own border; `card` adds one; `notice` frames a status message.
 */
type FrameVariant = 'bare' | 'card' | 'notice';

function Frame({
	wg,
	url,
	kind,
	isActive,
	variant,
	children,
}: {
	wg: Wordgard;
	url: string;
	kind: LinkEmbedKind;
	isActive: boolean;
	variant: FrameVariant;
	children: ReactNode;
}) {
	const isNotice = variant === 'notice';

	return (
		<div
			className={styles.frame[variant]}
			role="group"
			aria-label={
				kind === 'record'
					? 'Embedded record'
					: m['view.composer.embed.a11y.linkPreview']({ niceUrl: toNiceDomain(url) })
			}
		>
			{children}
			<div className={isNotice ? styles.noticeActions : styles.actions} onMouseDown={keepEditorFocus}>
				<Button
					label={kind === 'record' ? 'Remove embed' : 'Remove link preview'}
					size="tiny"
					color={isNotice ? 'secondary' : 'secondary_inverted'}
					variant={isNotice ? 'ghost' : 'solid'}
					shape="round"
					tabIndex={isActive ? 0 : -1}
					onClick={() => {
						dismissLinkEmbed(wg, url);
						// dismissing removes the focused button.
						wg.focus();
					}}
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>
		</div>
	);
}

function Notice({ icon: Icon, message }: { icon: typeof InfoIcon; message: string }) {
	return (
		<div className={styles.notice}>
			<Icon className={styles.noticeIcon} />
			<Text size="md_sub" weight="semiBold" color="textContrastMedium" numberOfLines={1}>
				{message}
			</Text>
		</div>
	);
}

// #endregion

// #region placeholders

function ExternalPlaceholder() {
	return (
		<>
			<div className={styles.skeletonThumb} />
			<div className={styles.body}>
				<Skeleton.Text size="sm" width="40%" />
				<Skeleton.Text size="md" width="80%" />
				<div className={styles.status}>
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
		<Skeleton.Col className={styles.placeholder} gap="sm">
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
		<Skeleton.Row className={styles.placeholder} align="center" gap="sm">
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

	const thumb = link.thumb && getBlobUrl(link.thumb.source.blob);
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
	wg: Wordgard;
	url: string;
	kind: LinkEmbedKind;
	isActive: boolean;
};

function ChatInviteCard({ code, ...frame }: LinkCardProps & { code: string }) {
	const { status, preview, action } = useChatInvite({ code });

	if (status === 'error') {
		return (
			<Frame {...frame} variant="notice">
				<Notice icon={InfoIcon} message="No preview for this link" />
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

function ResolvedLinkCard(frame: LinkCardProps) {
	const { data, error } = useResolveLinkQuery(frame.url);

	switch (data?.type) {
		case 'external': {
			const view = toViewExternal(data);
			if (!view) {
				return (
					<Frame {...frame} variant="notice">
						<Notice icon={InfoIcon} message="No preview for this link" />
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
		// no retry control: the planned publish path retries resolution failures.
		return (
			<Frame {...frame} variant="notice">
				{error instanceof EmbeddingDisabledError ? (
					<Notice icon={BanIcon} message="This post can't be quoted" />
				) : (
					<Notice icon={InfoIcon} message="No preview for this link" />
				)}
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
 * @param props the editor, the link's URL and embed slot, and whether the dismiss button is tabbable
 * @returns a preview, loading placeholder, or error notice
 */
export function LinkCard(props: LinkCardProps) {
	const link = resolveUrlToLink(props.url);
	if (link?.kind === 'chatInvite') {
		return <ChatInviteCard {...props} code={link.code} />;
	}

	return <ResolvedLinkCard {...props} />;
}
