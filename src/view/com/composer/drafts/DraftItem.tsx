import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

import * as device from '#/lib/deviceName';

import { TimeElapsed } from '#/view/com/util/TimeElapsed';

import { CirclePlus_Stroke2_Corner0_Rounded as CirclePlusIcon } from '#/components/icons/CirclePlus';
import type { Props as SVGIconProps } from '#/components/icons/common';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon } from '#/components/icons/DotGrid';
import { CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon } from '#/components/icons/Quote';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Text } from '#/components/Text';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

import * as styles from './DraftItem.css';
import { DraftRichText } from './DraftRichText';
import type { DraftPostDisplay, DraftSummary } from './state/schema';
import * as storage from './state/storage';

export function DraftItem({
	draft,
	onSelect,
	onDelete,
}: {
	draft: DraftSummary;
	onSelect: (draft: DraftSummary) => void;
	onDelete: (draft: DraftSummary) => void;
}) {
	const discardPromptHandle = Prompt.usePromptHandle();
	const post = draft.posts[0]!;

	const mediaExistsOnOtherDevice = !draft.meta.isOriginatingDevice && draft.meta.hasMissingMedia;
	const mediaIsMissing = draft.meta.isOriginatingDevice && draft.meta.hasMissingMedia;
	const hasMetadata = draft.meta.replyCount > 0 || mediaExistsOnOtherDevice || draft.meta.hasQuotes;

	let isUnknownDevice: boolean;
	switch (draft.draft.deviceName) {
		case device.FALLBACK_ANDROID:
		case device.FALLBACK_IOS:
		case device.FALLBACK_WEB:
			isUnknownDevice = true;
			break;
		default:
			isUnknownDevice = false;
			break;
	}

	const handleDelete = () => {
		onDelete(draft);
	};

	return (
		<div className={styles.wrapper}>
			<button
				type="button"
				className={styles.card}
				aria-label={m['view.composer.drafts.action.open']()}
				aria-description={m['view.composer.drafts.opensDraft']()}
				onClick={() => onSelect(draft)}
			>
				{!!post.text.trim().length && <DraftRichText value={post.text} numberOfLines={8} />}

				{!mediaExistsOnOtherDevice && <DraftMediaPreview post={post} />}

				{hasMetadata && (
					<div className={styles.metaList}>
						{mediaExistsOnOtherDevice && (
							<DraftMetadataTag
								icon={WarningIcon}
								text={
									isUnknownDevice
										? m['view.composer.media.storedOtherDevice']()
										: m['view.composer.media.storedOn']({
												deviceName: draft.draft.deviceName ?? '',
											})
								}
							/>
						)}
						{mediaIsMissing && (
							<DraftMetadataTag
								display="warning"
								icon={WarningIcon}
								text={m['view.composer.media.missing']()}
							/>
						)}
						{draft.meta.hasQuotes && (
							<DraftMetadataTag icon={CloseQuoteIcon} text={m['common.quote.post']()} />
						)}
						{draft.meta.replyCount > 0 && (
							<DraftMetadataTag
								icon={CirclePlusIcon}
								text={m['view.composer.thread.morePosts']({
									count: draft.meta.replyCount,
								})}
							/>
						)}
					</div>
				)}
			</button>
			{/* Timestamp */}
			<div className={styles.timestamp}>
				<TimeElapsed timestamp={draft.updatedAt}>
					{({ timeElapsed }) => (
						<Text size="sm" color="textContrastMedium" numberOfLines={1}>
							{timeElapsed}
						</Text>
					)}
				</TimeElapsed>
			</div>
			{/* Menu button — a detached Trigger for the discard prompt; sits outside the card so its click
			    never reaches the card's open handler. */}
			<div className={styles.menuSlot}>
				<Prompt.Trigger
					handle={discardPromptHandle}
					className={styles.menuButton}
					aria-label={m['common.a11y.moreOptions']()}
				>
					<DotsIcon className={styles.menuIcon} size="sm" fill="currentColor" />
				</Prompt.Trigger>
			</div>
			<Prompt.Basic
				handle={discardPromptHandle}
				title={m['view.composer.drafts.discard.title']()}
				description={m['view.composer.drafts.discard.message']()}
				onConfirm={handleDelete}
				confirmButtonCta={m['common.action.discard']()}
				confirmButtonColor="negative"
			/>
		</div>
	);
}

function DraftMetadataTag({
	display = 'info',
	icon: Icon,
	text,
}: {
	display?: 'info' | 'warning';
	icon: React.ComponentType<SVGIconProps>;
	text: string;
}) {
	return (
		<div className={clsx(styles.tagRow, display === 'warning' ? styles.tagWarning : styles.tagInfo)}>
			<Icon className={styles.tagIcon} size="sm" fill="currentColor" />
			<Text size="sm" className={styles.tagText}>
				{text}
			</Text>
		</div>
	);
}

type LoadedImage = {
	url: string;
	alt: string;
};

function DraftMediaPreview({ post }: { post: DraftPostDisplay }) {
	const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
	const [hasVideo, setHasVideo] = useState(false);

	useEffect(() => {
		const objectUrls: string[] = [];

		async function loadMedia() {
			if (post.images && post.images.length > 0) {
				const loaded: LoadedImage[] = [];
				for (const image of post.images) {
					try {
						const blob = await storage.loadMediaFromLocal(image.localPath);
						const url = URL.createObjectURL(blob);
						objectUrls.push(url);
						loaded.push({ url, alt: image.altText || '' });
					} catch {
						// image doesn't exist locally, skip it
					}
				}
				setLoadedImages(loaded);
			}

			// can't generate video thumbnails on web; flag presence so we render a placeholder tile.
			setHasVideo(Boolean(post.video?.exists && post.video.localPath));
		}

		void loadMedia();

		return () => {
			for (const url of objectUrls) {
				URL.revokeObjectURL(url);
			}
		};
	}, [post.images, post.video]);

	// nothing to show
	if (loadedImages.length === 0 && !post.gif && !post.video) {
		return null;
	}

	return (
		<div className={styles.mediaRow}>
			{loadedImages.map((image, i) => (
				<div key={i} className={styles.imageTile}>
					<MediaTile thumbnail={image.url} alt={image.alt} />
				</div>
			))}
			{post.gif && (
				<div className={styles.mediaTile}>
					<MediaTile thumbnail={post.gif.url} alt={post.gif.alt}>
						<div className={styles.overlay} aria-hidden>
							<PlayButtonIcon size={24} />
						</div>
						<div className={styles.gifBadge} aria-hidden>
							<Text className={styles.gifBadgeText}>{m['common.gif.label']()}</Text>
						</div>
					</MediaTile>
				</div>
			)}
			{post.video && hasVideo && (
				<div className={styles.mediaTile}>
					<MediaTile alt={post.video.altText}>
						<div className={styles.overlay} aria-hidden>
							<PlayButtonIcon size={24} />
						</div>
					</MediaTile>
				</div>
			)}
		</div>
	);
}

function MediaTile({
	thumbnail,
	alt,
	children,
}: {
	thumbnail?: string;
	alt?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className={clsx(styles.square, !thumbnail && styles.squareEmpty)}>
			{thumbnail && <img className={styles.image} src={thumbnail} alt={alt} />}
			{children}
		</div>
	);
}
