import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { type ModerationUI } from '@atproto/api';
import { Trans, useLingui } from '@lingui/react/macro';

import { openImagePicker } from '#/lib/media/picker';
import { isCancelledError } from '#/lib/strings/errors';

import {
	type ComposerImage,
	compressProfileImage,
	createComposerImage,
	type ImageMeta,
} from '#/state/gallery';

import { logger } from '#/logger';

import { EditImageDialog } from '#/view/com/composer/photos/EditImageDialog';
import { EventStopper } from '#/view/com/util/EventStopper';

import { atoms as a, tokens, useTheme } from '#/alf';

import { useDialogControl } from '#/components/Dialog';
import { Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon } from '#/components/icons/Camera';
import { StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon } from '#/components/icons/StreamingLive';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';

import { Image } from '#/shims/image';

export function UserBanner({
	type,
	banner,
	moderation,
	onSelectNewBanner,
}: {
	type?: 'labeler' | 'default';
	banner?: string | null;
	moderation?: ModerationUI;
	onSelectNewBanner?: (img: ImageMeta | null) => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const [rawImage, setRawImage] = useState<ComposerImage | undefined>();
	const editImageDialogControl = useDialogControl();

	const onOpenLibrary = useCallback(async () => {
		const file = await openImagePicker();
		if (!file) {
			return;
		}

		try {
			setRawImage(await createComposerImage(file));
			editImageDialogControl.open();
		} catch (e) {
			// Don't log errors for user-cancelled selection on iOS or Android.
			if (!isCancelledError(e)) {
				logger.error('Failed to crop banner', { error: e });
			}
		}
	}, [editImageDialogControl]);

	const onRemoveBanner = useCallback(() => {
		onSelectNewBanner?.(null);
	}, [onSelectNewBanner]);

	const onChangeEditImage = useCallback(
		async (image: ComposerImage) => {
			const compressed = await compressProfileImage(image, 3000, 1000);
			onSelectNewBanner?.(compressed);
		},
		[onSelectNewBanner],
	);

	// setUserBanner is only passed as prop on the EditProfile component
	return onSelectNewBanner ? (
		<>
			<EventStopper onKeyDown={true}>
				<Menu.Root>
					<Menu.Trigger label={l`Edit avatar`}>
						{({ props }) => (
							<Pressable {...props} testID="changeBannerBtn">
								{banner ? (
									<Image
										testID="userBannerImage"
										style={styles.bannerImage}
										source={{ uri: banner }}
										accessible={true}
										accessibilityIgnoresInvertColors
									/>
								) : (
									<View testID="userBannerFallback" style={[styles.bannerImage, t.atoms.bg_contrast_25]} />
								)}
								<View
									style={[
										styles.editButtonContainer,
										t.atoms.bg_contrast_25,
										a.border,
										t.atoms.border_contrast_low,
									]}
								>
									<CameraFilledIcon height={14} width={14} style={t.atoms.text} />
								</View>
							</Pressable>
						)}
					</Menu.Trigger>
					<Menu.Outer showCancel>
						<Menu.Group>
							<Menu.Item
								testID="changeBannerLibraryBtn"
								label={l`Upload from Library`}
								onPress={onOpenLibrary}
							>
								<Menu.ItemText>{<Trans>Upload from Files</Trans>}</Menu.ItemText>
								<Menu.ItemIcon icon={LibraryIcon} />
							</Menu.Item>
						</Menu.Group>
						{!!banner && (
							<>
								<Menu.Divider />
								<Menu.Group>
									<Menu.Item testID="changeBannerRemoveBtn" label={l`Remove Banner`} onPress={onRemoveBanner}>
										<Menu.ItemText>
											<Trans>Remove Banner</Trans>
										</Menu.ItemText>
										<Menu.ItemIcon icon={TrashIcon} />
									</Menu.Item>
								</Menu.Group>
							</>
						)}
					</Menu.Outer>
				</Menu.Root>
			</EventStopper>

			<EditImageDialog
				control={editImageDialogControl}
				image={rawImage}
				onChange={onChangeEditImage}
				aspectRatio={3}
			/>
		</>
	) : banner ? (
		<Image
			style={[styles.bannerImage, t.atoms.bg_contrast_25]}
			contentFit="cover"
			source={{ uri: banner }}
			blurRadius={moderation?.blur ? 100 : 0}
			accessible={true}
			accessibilityIgnoresInvertColors
		/>
	) : (
		<View style={[styles.bannerImage, type === 'labeler' ? styles.labelerBanner : t.atoms.bg_contrast_25]} />
	);
}

const styles = StyleSheet.create({
	editButtonContainer: {
		position: 'absolute',
		width: 24,
		height: 24,
		bottom: 8,
		right: 24,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	bannerImage: {
		width: '100%',
		height: 150,
	},
	labelerBanner: {
		backgroundColor: tokens.color.temp_purple,
	},
});
