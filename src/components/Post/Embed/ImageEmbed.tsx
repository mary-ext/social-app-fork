import { InteractionManager, View } from 'react-native';

import { atoms as a } from '#/alf';

import { AutoSizedImage } from '#/components/images/AutoSizedImage';
import { Gallery } from '#/components/images/Gallery';
import { useLightboxControls } from '#/components/Lightbox/state';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';

import { Image } from '#/shims/image';
import { type EmbedType } from '#/types/embed';

import { type CommonProps } from './types';

export function ImageEmbed({
	embed,
	...rest
}: CommonProps & {
	embed: EmbedType<'images'>;
}) {
	const { openLightbox } = useLightboxControls();
	const { images } = embed.view;

	if (images.length > 0) {
		const items = images.map((img) => ({
			alt: img.alt,
			uri: img.fullsize,
		}));
		const onPress = (index: number) => {
			openLightbox({
				images: items.map((item) => ({
					...item,
					type: 'image' as const,
				})),
				index,
			});
		};
		const onPressIn = (_: number) => {
			InteractionManager.runAfterInteractions(() => {
				Image.prefetch(
					items.map((i) => i.uri),
					'memory',
				);
			});
		};

		if (images.length === 1) {
			const image = images[0]!;
			return (
				<View style={[a.mt_sm, rest.style]}>
					<AutoSizedImage
						crop={
							rest.viewContext === PostEmbedViewContext.ThreadHighlighted
								? 'none'
								: rest.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
									? 'square'
									: 'constrained'
						}
						image={image}
						onPress={() => onPress(0)}
						onPressIn={() => onPressIn(0)}
						hideBadge={rest.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia}
					/>
				</View>
			);
		}

		return (
			<View style={[a.mt_sm, rest.style]}>
				<Gallery images={images} onPress={onPress} onPressIn={onPressIn} viewContext={rest.viewContext} />
			</View>
		);
	}
}
