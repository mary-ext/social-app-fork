import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import type { AppBskyEmbedImages } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { atoms as a, useTheme, utils } from '#/alf';

import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';
import { Text } from '#/components/Typography';

import { Image, type ImageStyle } from '#/shims/image';
import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

type EventFunction = (index: number) => void;

interface Props {
	images: AppBskyEmbedImages.ViewImage[];
	index: number;
	onPress?: (index: number) => void;
	onLongPress?: EventFunction;
	onPressIn?: EventFunction;
	imageStyle?: StyleProp<ImageStyle>;
	viewContext?: PostEmbedViewContext;
	insetBorderStyle?: StyleProp<ViewStyle>;
}

export function GalleryItem({
	images,
	index,
	imageStyle,
	onPress,
	onPressIn,
	onLongPress,
	viewContext,
	insetBorderStyle,
}: Props) {
	const t = useTheme();
	const { t: l } = useLingui();
	const [largeAltBadge] = useLargeAltBadgeEnabled();
	const image = images[index]!;
	const hasAlt = !!image.alt;
	const hideBadges = viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia;
	return (
		<View style={a.flex_1}>
			<Pressable
				onPress={onPress ? () => onPress(index) : undefined}
				onPressIn={onPressIn ? () => onPressIn(index) : undefined}
				onLongPress={onLongPress ? () => onLongPress(index) : undefined}
				android_ripple={{
					color: utils.alpha(t.atoms.bg.backgroundColor, 0.2),
					foreground: true,
				}}
				style={[a.flex_1, a.overflow_hidden, t.atoms.bg_contrast_25, imageStyle]}
				accessibilityRole="button"
				accessibilityLabel={image.alt || l`Image`}
				accessibilityHint=""
			>
				<Image
					source={{ uri: image.thumb }}
					style={[a.flex_1]}
					accessible={true}
					accessibilityLabel={image.alt}
					accessibilityHint=""
					accessibilityIgnoresInvertColors
					loading="lazy"
				/>
				<MediaInsetBorder style={insetBorderStyle} />
			</Pressable>
			{hasAlt && !hideBadges ? (
				<View
					accessible={false}
					style={[
						a.absolute,
						a.flex_row,
						a.align_center,
						a.rounded_xs,
						t.atoms.bg_contrast_25,
						{
							gap: 3,
							padding: 3,
							bottom: a.p_xs.padding,
							right: a.p_xs.padding,
							opacity: 0.8,
						},
						largeAltBadge && [
							{
								gap: 4,
								padding: 5,
							},
						],
					]}
				>
					<Text style={[a.font_bold, largeAltBadge ? a.text_xs : { fontSize: 8 }]}>
						<Trans>ALT</Trans>
					</Text>
				</View>
			) : null}
		</View>
	);
}
