import type { AppBskyEmbedImages } from '@atcute/bluesky';
import type { LightboxImage } from '@oomfware/lightbox';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { AutoSizedImage } from '#/components/ImageEmbed/AutoSizedImage';
import { Gallery } from '#/components/ImageEmbed/Gallery';
import { type CommonProps, PostEmbedViewContext } from '#/components/Post/Embed/types';

import type { EmbedType } from '#/types/embed';

import * as styles from './index.css';

/** Warm the browser cache with the full-size images so the lightbox opens instantly. */
function prefetch(uris: string[]) {
	const run = () => {
		for (const uri of uris) {
			const img = new window.Image();
			img.src = uri;
		}
	};
	if ('requestIdleCallback' in window) {
		window.requestIdleCallback(run);
	} else {
		setTimeout(run, 0);
	}
}

export function ImageEmbed({
	embed,
	viewContext,
}: CommonProps & {
	embed: EmbedType<'images'> | EmbedType<'gallery'>;
}) {
	const { lightboxHandle } = useGlobalDialogsHandleContext();
	// Gallery embeds carry the same image data under different field names (`thumbnail` -> `thumb`);
	// normalize to `ViewImage` so the carousel and lightbox stay shared with the `images` embed.
	const images: AppBskyEmbedImages.ViewImage[] =
		embed.type === 'gallery'
			? embed.view.items.map((item) => ({
					alt: item.alt,
					aspectRatio: item.aspectRatio,
					fullsize: item.fullsize,
					thumb: item.thumbnail,
				}))
			: embed.view.images;

	if (images.length === 0) {
		return null;
	}

	const lightboxImages: LightboxImage[] = images.map((img) => ({ alt: img.alt, src: img.fullsize }));
	const onPressIn = () => prefetch(lightboxImages.map((i) => i.src));

	return (
		<div className={styles.wrapper}>
			{images.length === 1 ? (
				<AutoSizedImage
					image={images[0]!}
					crop={
						viewContext === PostEmbedViewContext.ThreadHighlighted
							? 'none'
							: viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
								? 'square'
								: 'constrained'
					}
					hideBadge={viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia}
					handle={lightboxHandle}
					payload={{ images: lightboxImages, index: 0 }}
					onPressIn={onPressIn}
				/>
			) : (
				<Gallery
					images={images}
					handle={lightboxHandle}
					lightboxImages={lightboxImages}
					onPressIn={onPressIn}
					viewContext={viewContext}
				/>
			)}
		</div>
	);
}
