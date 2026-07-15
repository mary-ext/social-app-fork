import type { AppBskyEmbedGallery, AppBskyEmbedImages } from '@atcute/bluesky';

import type { LightboxImage } from '@oomfware/lightbox';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { AutoSizedImage } from '#/components/ImageEmbed/AutoSizedImage';
import { EMPTY_ASPECT_RATIO } from '#/components/ImageEmbed/carousel/const';
import { Gallery } from '#/components/ImageEmbed/Gallery';
import { preloadLightbox } from '#/components/Lightbox';
import { type CommonProps, PostEmbedViewContext } from '#/components/Post/Embed/types';

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
	embed: AppBskyEmbedGallery.View | AppBskyEmbedImages.View;
}) {
	const { lightboxHandle } = useGlobalDialogsHandleContext();
	// Normalize to the gallery interface so the carousel and lightbox stay shared.
	const images: AppBskyEmbedGallery.ViewImage[] =
		'items' in embed
			? embed.items
			: embed.images.map((img) => ({
					alt: img.alt,
					aspectRatio: img.aspectRatio || EMPTY_ASPECT_RATIO,
					fullsize: img.fullsize,
					thumbnail: img.thumb,
				}));

	if (images.length === 0) {
		return null;
	}

	const lightboxImages: LightboxImage[] = images.map((img) => ({ alt: img.alt, src: img.fullsize }));
	const onPressIn = () => {
		preloadLightbox();
		prefetch(lightboxImages.map((i) => i.src));
	};

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
