'use no memo'; // compiler output is duplicated across lazy chunks and outweighs these thin wrappers

import type { ReactNode } from 'react';

import { unwrapEmbed, type AppBskyFeedDefs } from '@atcute/bluesky';
import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import { videoThumbnailUrl } from '#/lib/bsky-cdn';
import { isGifEmbed } from '#/lib/media/gif-embed';

import * as styles from '#/components/MediaPreview.css';
import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

export function Embed({
	className,
	embed,
	moderation,
}: {
	className?: string;
	embed: AppBskyFeedDefs.PostView['embed'];
	moderation?: DisplayRestrictions;
}) {
	const { media } = unwrapEmbed(embed);

	if (!media) {
		return null;
	}

	const blurred = !!moderation?.blurs.length;

	switch (media.$type) {
		case 'app.bsky.embed.images#view': {
			return (
				<Outer className={className}>
					{media.images.map((image) => (
						<ImageItem key={image.thumb} thumbnail={image.thumb} alt={image.alt} blurred={blurred} />
					))}
				</Outer>
			);
		}
		case 'app.bsky.embed.gallery#view': {
			// cap at 4 tiles so a large gallery doesn't blow out this narrow inline strip
			return (
				<Outer className={className}>
					{media.items.slice(0, 4).map((image) => (
						<ImageItem key={image.thumbnail} thumbnail={image.thumbnail} alt={image.alt} blurred={blurred} />
					))}
				</Outer>
			);
		}
		case 'app.bsky.embed.external#view': {
			if (!media.external.thumb || !isGifEmbed(media.external.uri)) {
				return null;
			}
			return (
				<Outer className={className}>
					<GifItem thumbnail={media.external.thumb} alt={media.external.title} blurred={blurred} />
				</Outer>
			);
		}
		case 'app.bsky.embed.video#view': {
			return (
				<Outer className={className}>
					{media.presentation === 'gif' ? (
						<GifItem thumbnail={videoThumbnailUrl(media)} alt={media.alt} blurred={blurred} />
					) : (
						<VideoItem thumbnail={videoThumbnailUrl(media)} alt={media.alt} blurred={blurred} />
					)}
				</Outer>
			);
		}
		default: {
			return null;
		}
	}
}

function Outer({ children, className }: { children?: ReactNode; className?: string }) {
	return <div className={clsx(styles.outer, className)}>{children}</div>;
}

function ImageItem({
	thumbnail,
	alt,
	blurred,
	children,
}: {
	thumbnail?: string;
	alt?: string;
	blurred?: boolean;
	children?: ReactNode;
}) {
	return (
		<div
			className={clsx(styles.tile, !thumbnail && styles.tileEmpty)}
			aria-label={thumbnail ? undefined : alt}
		>
			{thumbnail && (
				<img className={clsx(styles.image, blurred && styles.blurred)} src={thumbnail} alt={alt} />
			)}
			{children}
		</div>
	);
}

function GifItem({ thumbnail, alt, blurred }: { thumbnail?: string; alt?: string; blurred?: boolean }) {
	return (
		<ImageItem thumbnail={thumbnail} alt={alt} blurred={blurred}>
			<div className={styles.overlay} aria-hidden>
				<PlayButtonIcon size={24} />
			</div>
			<div className={styles.gifBadge} aria-hidden>
				<Text className={styles.gifBadgeText}>{m['common.gif.label']()}</Text>
			</div>
		</ImageItem>
	);
}

function VideoItem({ thumbnail, alt, blurred }: { thumbnail?: string; alt?: string; blurred?: boolean }) {
	return (
		<ImageItem thumbnail={thumbnail} alt={alt} blurred={blurred}>
			<div className={styles.overlay} aria-hidden>
				<PlayButtonIcon size={24} />
			</div>
		</ImageItem>
	);
}
