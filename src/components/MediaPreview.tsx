import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { unwrapEmbed, type AppBskyFeedDefs } from '@atcute/bluesky';

import { isGifEmbed } from '#/lib/strings/embed-player';

import { atoms as a, useTheme } from '#/alf';

import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { Text } from '#/components/Typography';
import { PlayButtonIcon } from '#/components/video/PlayButtonIcon';

import { m } from '#/paraglide/messages';
import { Image } from '#/shims/image';

/** Streamlined MediaPreview component which just handles images, gifs, and videos */
export function Embed({
	embed,
	style,
}: {
	embed: AppBskyFeedDefs.PostView['embed'];
	style?: StyleProp<ViewStyle>;
}) {
	const { media } = unwrapEmbed(embed);

	if (!media) {
		return null;
	}

	switch (media.$type) {
		case 'app.bsky.embed.images#view': {
			return (
				<Outer style={style}>
					{media.images.map((image) => (
						<ImageItem key={image.thumb} thumbnail={image.thumb} alt={image.alt} />
					))}
				</Outer>
			);
		}
		case 'app.bsky.embed.gallery#view': {
			// cap at 4 tiles so a large gallery doesn't blow out this narrow inline strip
			return (
				<Outer style={style}>
					{media.items.slice(0, 4).map((image) => (
						<ImageItem key={image.thumbnail} thumbnail={image.thumbnail} alt={image.alt} />
					))}
				</Outer>
			);
		}
		case 'app.bsky.embed.external#view': {
			if (!media.external.thumb) {
				return null;
			}
			if (!isGifEmbed(media.external.uri)) {
				return null;
			}
			return (
				<Outer style={style}>
					<GifItem thumbnail={media.external.thumb} alt={media.external.title} />
				</Outer>
			);
		}
		case 'app.bsky.embed.video#view': {
			return (
				<Outer style={style}>
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

export function Outer({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
	return <View style={[a.flex_row, a.gap_xs, style]}>{children}</View>;
}

export function ImageItem({
	thumbnail,
	alt,
	children,
	maxWidth = 100,
}: {
	thumbnail?: string;
	alt?: string;
	children?: React.ReactNode;
	maxWidth?: number;
}) {
	const t = useTheme();

	if (!thumbnail) {
		return (
			<View
				style={[{ backgroundColor: 'black' }, a.flex_1, a.aspect_square, { maxWidth }, a.rounded_xs]}
				accessibilityLabel={alt}
				accessibilityHint=""
			>
				{children}
			</View>
		);
	}

	return (
		<View style={[a.flex_grow, a.relative, a.aspect_square, { maxWidth }]}>
			<Image
				key={thumbnail}
				source={{ uri: thumbnail }}
				alt={alt}
				style={[a.flex_1, a.rounded_xs, t.atoms.bg_contrast_25]}
				contentFit="cover"
				accessible={true}
				accessibilityIgnoresInvertColors
			/>
			<MediaInsetBorder style={[a.rounded_xs]} />
			{children}
		</View>
	);
}

export function GifItem({ thumbnail, alt }: { thumbnail?: string; alt?: string }) {
	return (
		<ImageItem thumbnail={thumbnail} alt={alt}>
			<View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
				<PlayButtonIcon size={24} />
			</View>
			<View style={styles.altContainer}>
				<Text style={styles.alt}>{m['common.gif.label']()}</Text>
			</View>
		</ImageItem>
	);
}

export function VideoItem({ thumbnail, alt }: { thumbnail?: string; alt?: string }) {
	return (
		<ImageItem thumbnail={thumbnail} alt={alt}>
			<View style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
				<PlayButtonIcon size={24} />
			</View>
		</ImageItem>
	);
}

const styles = StyleSheet.create({
	altContainer: {
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		borderRadius: 6,
		paddingHorizontal: 6,
		paddingVertical: 3,
		position: 'absolute',
		left: 5,
		bottom: 5,
		zIndex: 2,
	},
	alt: {
		color: 'white',
		fontSize: 7,
		fontWeight: '600',
	},
});
