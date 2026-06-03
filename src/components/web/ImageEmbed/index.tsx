import { useLightboxControls } from '#/components/Lightbox/state';
import { type CommonProps, PostEmbedViewContext } from '#/components/Post/Embed/types';
import { AutoSizedImage } from '#/components/web/ImageEmbed/AutoSizedImage';
import { Gallery } from '#/components/web/ImageEmbed/Gallery';

import { sprinkles } from '#/styles/sprinkles.css';
import type { EmbedType } from '#/types/embed';

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

const wrapper = sprinkles({ marginTop: 'sm' });

export function ImageEmbed({
	embed,
	viewContext,
}: CommonProps & {
	embed: EmbedType<'images'>;
}) {
	const { openLightbox } = useLightboxControls();
	const { images } = embed.view;

	if (images.length === 0) {
		return null;
	}

	const items = images.map((img) => ({ alt: img.alt, uri: img.fullsize }));
	const onPress = (index: number) => {
		openLightbox({
			images: items.map((item) => ({ ...item, type: 'image' as const })),
			index,
		});
	};
	const onPressIn = () => prefetch(items.map((i) => i.uri));

	return (
		<div className={wrapper}>
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
					onPress={() => onPress(0)}
					onPressIn={onPressIn}
				/>
			) : (
				<Gallery images={images} onPress={onPress} onPressIn={onPressIn} viewContext={viewContext} />
			)}
		</div>
	);
}
