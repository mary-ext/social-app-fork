import { useCallback, useState } from 'react';
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

import { Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon } from '#/components/icons/Camera';
import { StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon } from '#/components/icons/StreamingLive';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as styles from '#/components/web/EditableBanner.css';
import * as Menu from '#/components/web/Menu';
import { useSheetHandle } from '#/components/web/Sheet';

/** Web-native banner editor: a menu-triggering banner that crops uploads via {@link EditImageDialog}. */
export function EditableBanner({
	banner,
	onSelectNewBanner,
}: {
	banner?: string | null;
	onSelectNewBanner: (img: ImageMeta | null) => void;
}) {
	const { t: l } = useLingui();
	const [rawImage, setRawImage] = useState<ComposerImage | undefined>();
	const editImageDialogControl = useSheetHandle();

	const onOpenLibrary = useCallback(async () => {
		const file = await openImagePicker();
		if (!file) {
			return;
		}
		try {
			setRawImage(await createComposerImage(file));
			editImageDialogControl.open(null);
		} catch (e) {
			// Don't log errors for user-cancelled selection.
			if (!isCancelledError(e)) {
				logger.error('Failed to crop banner', { error: e });
			}
		}
	}, [editImageDialogControl]);

	const onChangeEditImage = useCallback(
		async (image: ComposerImage) => {
			onSelectNewBanner(await compressProfileImage(image, 3000, 1000));
		},
		[onSelectNewBanner],
	);

	return (
		<>
			<Menu.Root>
				<Menu.Trigger aria-label={l`Edit banner`} className={styles.trigger}>
					{banner && <img className={styles.image} src={banner} alt="" />}
					<span className={styles.editBadge}>
						<CameraFilledIcon width={14} height={14} fill="currentColor" />
					</span>
				</Menu.Trigger>
				<Menu.Popup label={l`Edit banner`} align="center">
					<Menu.Item onClick={onOpenLibrary}>
						<Menu.ItemText>
							<Trans>Upload from Files</Trans>
						</Menu.ItemText>
						<Menu.ItemIcon icon={LibraryIcon} />
					</Menu.Item>
					{!!banner && (
						<>
							<Menu.Separator />
							<Menu.Item destructive onClick={() => onSelectNewBanner(null)}>
								<Menu.ItemText>
									<Trans>Remove Banner</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon icon={TrashIcon} />
							</Menu.Item>
						</>
					)}
				</Menu.Popup>
			</Menu.Root>
			<EditImageDialog
				handle={editImageDialogControl}
				image={rawImage}
				onChange={onChangeEditImage}
				aspectRatio={3}
			/>
		</>
	);
}
