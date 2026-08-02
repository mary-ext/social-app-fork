import { useState } from 'react';

import {
	type ComposerImage,
	compressProfileImage,
	createComposerImage,
	type ImageMeta,
} from '#/lib/media/composer-image';
import { openImagePicker } from '#/lib/media/picker';
import { isCancelledError } from '#/lib/strings/errors';

import * as Dialog from '#/components/Dialog';
import * as styles from '#/components/EditableBanner.css';
import { EditImageDialog } from '#/components/EditImageDialog/EditImageDialog';
import * as Menu from '#/components/Menu';

import CameraFilledIcon from '#/icons/central/Camera1_round_filled_radius1_stroke2.svg';
import LibraryIcon from '#/icons/central/Streaming_round_outlined_radius1_stroke2.svg';
import TrashIcon from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/** Web-native banner editor: a menu-triggering banner that crops uploads via {@link EditImageDialog}. */
export function EditableBanner({
	banner,
	onSelectNewBanner,
}: {
	banner?: string | null;
	onSelectNewBanner: (img: ImageMeta | null) => void;
}) {
	const [rawImage, setRawImage] = useState<ComposerImage | undefined>();
	const editImageDialogHandle = Dialog.useDialogHandle();

	const onOpenLibrary = async () => {
		const file = await openImagePicker();
		if (!file) {
			return;
		}
		try {
			setRawImage(await createComposerImage(file));
			editImageDialogHandle.open(null);
		} catch (e) {
			// a user-cancelled selection is not a failure worth reporting
			if (!isCancelledError(e)) {
				console.error('Failed to crop banner', e);
			}
		}
	};

	const onChangeEditImage = async (image: ComposerImage) => {
		onSelectNewBanner(await compressProfileImage(image, 3000, 1000));
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger aria-label={m['components.editableBanner.edit']()} className={styles.trigger}>
					{banner && <img className={styles.image} src={banner} alt="" />}
					<span className={styles.editBadge}>
						<CameraFilledIcon className={styles.cameraFilledIcon} />
					</span>
				</Menu.Trigger>
				<Menu.Popup label={m['components.editableBanner.edit']()} align="center">
					<Menu.Item onClick={() => void onOpenLibrary()}>
						<Menu.ItemText>{m['common.action.uploadFromFiles']()}</Menu.ItemText>
						<Menu.ItemIcon icon={LibraryIcon} />
					</Menu.Item>
					{!!banner && (
						<>
							<Menu.Separator />
							<Menu.Item destructive onClick={() => onSelectNewBanner(null)}>
								<Menu.ItemText>{m['components.editableBanner.remove']()}</Menu.ItemText>
								<Menu.ItemIcon icon={TrashIcon} />
							</Menu.Item>
						</>
					)}
				</Menu.Popup>
			</Menu.Root>
			<EditImageDialog
				handle={editImageDialogHandle}
				image={rawImage}
				onChange={(image) => void onChangeEditImage(image)}
				aspectRatio={3}
			/>
		</>
	);
}
