import { memo, useMemo, useState } from 'react';
import {
	type ImageStyle,
	Keyboard,
	type LayoutChangeEvent,
	StyleSheet,
	TouchableOpacity,
	View,
	type ViewStyle,
} from 'react-native';

import { useBlobUrl } from '#/lib/hooks/useBlobUrl';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import type { Dimensions } from '#/lib/media/types';
import { colors } from '#/lib/styles';

import type { ComposerImage } from '#/state/gallery';

import { atoms as a, tokens, useTheme } from '#/alf';

import { Admonition } from '#/components/Admonition';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { Pencil_Stroke2_Corner0_Rounded as PencilIcon } from '#/components/icons/Pencil';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '#/components/icons/Times';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { Text } from '#/components/Typography';
import { useDialogHandle } from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';
import { Image } from '#/shims/image';

import type { PostAction } from '../state/composer';
import { EditImageDialog } from './EditImageDialog';
import { ImageAltTextDialog } from './ImageAltTextDialog';

const IMAGE_GAP = 8;

interface GalleryProps {
	images: ComposerImage[];
	dispatch: (action: PostAction) => void;
}

export let Gallery = (props: GalleryProps): React.ReactNode => {
	const [containerInfo, setContainerInfo] = useState<Dimensions>();

	const onLayout = (evt: LayoutChangeEvent) => {
		const { width, height } = evt.nativeEvent.layout;
		setContainerInfo({
			width,
			height,
		});
	};

	return (
		<View onLayout={onLayout}>
			{containerInfo ? <GalleryInner {...props} containerInfo={containerInfo} /> : undefined}
		</View>
	);
};
Gallery = memo(Gallery);

interface GalleryInnerProps extends GalleryProps {
	containerInfo: Dimensions;
}

const GalleryInner = ({ images, containerInfo, dispatch }: GalleryInnerProps) => {
	const { isMobile } = useWebMediaQueries();

	const { altTextControlStyle, imageControlsStyle, imageStyle } = useMemo(() => {
		// Cap columns at 4 so tiles stay tappable when MAX_GALLERY_IMAGES is high; n > 4 wraps to multiple
		// rows via flexWrap on the gallery container.
		const columns = Math.min(images.length, 4);
		const side = images.length === 1 ? 250 : (containerInfo.width - IMAGE_GAP * (columns - 1)) / columns;

		const isOverflow = isMobile && images.length > 2;

		return {
			altTextControlStyle: isOverflow
				? { left: 4, bottom: 4 }
				: !isMobile && images.length < 3
					? { left: 8, top: 8 }
					: { left: 4, top: 4 },
			imageControlsStyle: {
				display: 'flex' as const,
				flexDirection: 'row' as const,
				position: 'absolute' as const,
				...(isOverflow
					? { top: 4, right: 4, gap: 4 }
					: !isMobile && images.length < 3
						? { top: 8, right: 8, gap: 8 }
						: { top: 4, right: 4, gap: 4 }),
				zIndex: 1,
			},
			imageStyle: {
				height: side,
				width: side,
			},
		};
	}, [images.length, containerInfo, isMobile]);

	return images.length !== 0 ? (
		<>
			<View testID="selectedPhotosView" style={styles.gallery}>
				{images.map((image) => {
					return (
						<GalleryItem
							key={image.source.id}
							image={image}
							altTextControlStyle={altTextControlStyle}
							imageControlsStyle={imageControlsStyle}
							imageStyle={imageStyle}
							onChange={(next) => {
								dispatch({ type: 'embed_update_image', image: next });
							}}
							onRemove={() => {
								dispatch({ type: 'embed_remove_image', image });
							}}
						/>
					);
				})}
			</View>
			{images.some((image) => !image.alt) && (
				<Admonition type="info" style={[a.mt_sm]}>
					{m['view.composer.altText.hint']()}
				</Admonition>
			)}
		</>
	) : null;
};

type GalleryItemProps = {
	image: ComposerImage;
	altTextControlStyle?: ViewStyle;
	imageControlsStyle?: ViewStyle;
	imageStyle?: ImageStyle;
	onChange: (next: ComposerImage) => void;
	onRemove: () => void;
};

const GalleryItem = ({
	image,
	altTextControlStyle,
	imageControlsStyle,
	imageStyle,
	onChange,
	onRemove,
}: GalleryItemProps): React.ReactNode => {
	const t = useTheme();

	const imageUrl = useBlobUrl((image.transformed ?? image.source).blob);

	const altTextControl = useDialogHandle();
	const editControl = useDialogHandle();

	const onImageEdit = () => {
		editControl.open(null);
	};

	const onAltTextEdit = () => {
		Keyboard.dismiss();
		altTextControl.open(null);
	};

	return (
		<View
			style={imageStyle}
			// Fixes ALT and icons appearing with half opacity when the post is inactive
			renderToHardwareTextureAndroid
		>
			<TouchableOpacity
				testID="altTextButton"
				accessibilityRole="button"
				accessibilityLabel={m['view.composer.altText.action.add']()}
				accessibilityHint=""
				onPress={onAltTextEdit}
				style={[styles.altTextControl, altTextControlStyle]}
			>
				{image.alt.length !== 0 ? (
					<CheckIcon width={10} style={{ color: t.palette.white }} />
				) : (
					<PlusIcon width={10} style={{ color: t.palette.white }} />
				)}
				<Text style={styles.altTextControlLabel} accessible={false}>
					{m['common.altText.badge']()}
				</Text>
			</TouchableOpacity>
			<View style={imageControlsStyle}>
				<TouchableOpacity
					testID="editPhotoButton"
					accessibilityRole="button"
					accessibilityLabel={m['view.composer.gallery.action.edit']()}
					accessibilityHint=""
					onPress={onImageEdit}
					style={styles.imageControl}
				>
					<PencilIcon size="xs" style={{ color: colors.white }} />
				</TouchableOpacity>
				<TouchableOpacity
					testID="removePhotoButton"
					accessibilityRole="button"
					accessibilityLabel={m['view.composer.gallery.action.remove']()}
					accessibilityHint=""
					onPress={onRemove}
					style={styles.imageControl}
				>
					<TimesIcon size="sm" style={{ color: colors.white }} />
				</TouchableOpacity>
			</View>
			<TouchableOpacity
				accessibilityRole="button"
				accessibilityLabel={m['view.composer.altText.action.add']()}
				accessibilityHint=""
				onPress={onAltTextEdit}
				style={styles.altTextHiddenRegion}
			/>
			<Image
				testID="selectedPhotoImage"
				style={[styles.image, imageStyle]}
				source={{ uri: imageUrl }}
				accessible={true}
				accessibilityIgnoresInvertColors
				cachePolicy="none"
				autoplay={false}
				contentFit="cover"
			/>
			<MediaInsetBorder />
			<ImageAltTextDialog handle={altTextControl} image={image} onChange={onChange} />
			<EditImageDialog handle={editControl} image={image} onChange={onChange} />
		</View>
	);
};

const styles = StyleSheet.create({
	gallery: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: IMAGE_GAP,
		marginTop: 16,
	},
	image: {
		borderRadius: tokens.borderRadius.md,
	},
	imageControl: {
		width: 24,
		height: 24,
		borderRadius: tokens.borderRadius.md,
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	altTextControl: {
		position: 'absolute',
		zIndex: 1,
		borderRadius: 6,
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		paddingHorizontal: 8,
		paddingVertical: 3,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	altTextControlLabel: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 1,
	},
	altTextHiddenRegion: {
		position: 'absolute',
		left: 4,
		right: 4,
		bottom: 4,
		top: 30,
		zIndex: 1,
	},
});
