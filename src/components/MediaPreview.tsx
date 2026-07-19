import { unwrapEmbed, type AppBskyFeedDefs } from '@atcute/bluesky';

import { clsx } from 'clsx';

import { isGifEmbed } from '#/lib/strings/embed-player';

import * as styles from '#/components/MediaPreview.css';
import { PlayButtonIcon } from '#/components/PlayButtonIcon';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

/**
 * Streamlined media preview that renders a post's images, gifs, and videos as a compact inline strip of
 * square thumbnails.
 */
export function Embed({
	className,
	embed,
}: {
	className?: string;
	embed: AppBskyFeedDefs.PostView['embed'];
}) {
	const { media } = unwrapEmbed(embed);

	if (!media) {
		return null;
	}

	switch (media.$type) {
		case 'app.bsky.embed.images#view': {
			return (
				<Outer className={className}>
					{media.images.map((image) => (
						<ImageItem key={image.thumb} thumbnail={image.thumb} alt={image.alt} />
					))}
				</Outer>
			);
		}
		case 'app.bsky.embed.gallery#view': {
			// cap at 4 tiles so a large gallery doesn't blow out this narrow inline strip
			return (
				<Outer className={className}>
					{media.items.slice(0, 4).map((image) => (
						<ImageItem key={image.thumbnail} thumbnail={image.thumbnail} alt={image.alt} />
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
					<GifItem thumbnail={media.external.thumb} alt={media.external.title} />
				</Outer>
			);
		}
		case 'app.bsky.embed.video#view': {
			return (
				<Outer className={className}>
					{media.presentation === 'gif' ? (
						<GifItem thumbnail={media.thumbnail} alt={media.alt} />
					) : (
						<VideoItem thumbnail={media.thumbnail} alt={media.alt} />
					)}
				</Outer>
			);
		}
		default: {
			return null;
		}
	}
}

function Outer({ children, className }: { children?: React.ReactNode; className?: string }) {
	return <div className={clsx(styles.outer, className)}>{children}</div>;
}

function ImageItem({
	thumbnail,
	alt,
	children,
}: {
	thumbnail?: string;
	alt?: string;
	children?: React.ReactNode;
}) {
	return (
		<div
			className={clsx(styles.tile, !thumbnail && styles.tileEmpty)}
			aria-label={thumbnail ? undefined : alt}
		>
			{thumbnail && <img className={styles.image} src={thumbnail} alt={alt} />}
			{children}
		</div>
	);
}

function GifItem({ thumbnail, alt }: { thumbnail?: string; alt?: string }) {
	return (
		<ImageItem thumbnail={thumbnail} alt={alt}>
			<div className={styles.overlay} aria-hidden>
				<PlayButtonIcon size={24} />
			</div>
			<div className={styles.gifBadge} aria-hidden>
				<Text className={styles.gifBadgeText}>{m['common.gif.label']()}</Text>
			</div>
		</ImageItem>
	);
}

function VideoItem({ thumbnail, alt }: { thumbnail?: string; alt?: string }) {
	return (
		<ImageItem thumbnail={thumbnail} alt={alt}>
			<div className={styles.overlay} aria-hidden>
				<PlayButtonIcon size={24} />
			</div>
		</ImageItem>
	);
}
