import { useState } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';

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

import * as styles from '#/components/EditableUserAvatar.css';
import { Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon } from '#/components/icons/Camera';
import { StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon } from '#/components/icons/StreamingLive';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as Menu from '#/components/Menu';
import { UserAvatar, type UserAvatarType } from '#/components/UserAvatar';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

/** Web-native avatar editor: a menu-triggering avatar that crops uploads via {@link EditImageDialog}. */
export function EditableUserAvatar({
	type = 'user',
	size,
	avatar,
	onSelectNewAvatar,
}: {
	type?: UserAvatarType;
	size: number;
	avatar?: string | null;
	onSelectNewAvatar: (img: ImageMeta | null) => void;
}) {
	const [rawImage, setRawImage] = useState<ComposerImage | undefined>();
	const editImageDialogHandle = Dialog.useDialogHandle();

	const circular = type !== 'algo' && type !== 'list';
	const radius = circular ? '50%' : size > 32 ? '8px' : '3px';

	const onOpenLibrary = async () => {
		const file = await openImagePicker();
		if (!file) {
			return;
		}
		try {
			setRawImage(await createComposerImage(file));
			editImageDialogHandle.open(null);
		} catch (e) {
			// Don't log errors for user-cancelled selection.
			if (!isCancelledError(e)) {
				logger.error('Failed to crop avatar', { error: e });
			}
		}
	};

	const onChangeEditImage = async (image: ComposerImage) => {
		onSelectNewAvatar(await compressProfileImage(image, 1000, 1000));
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					aria-label={m['components.editableUserAvatar.edit']()}
					className={styles.trigger}
					style={assignInlineVars({ [styles.sizeVar]: `${size}px`, [styles.radiusVar]: radius })}
				>
					<UserAvatar
						type={type}
						shape={circular ? 'circle' : 'square'}
						size={size}
						avatar={avatar}
						noBorder
					/>
					<span className={styles.editBadge}>
						<CameraFilledIcon width={14} height={14} fill="currentColor" />
					</span>
				</Menu.Trigger>
				<Menu.Popup label={m['components.editableUserAvatar.edit']()}>
					<Menu.Item onClick={() => void onOpenLibrary()}>
						<Menu.ItemText>{m['common.action.uploadFromFiles']()}</Menu.ItemText>
						<Menu.ItemIcon icon={LibraryIcon} />
					</Menu.Item>
					{!!avatar && (
						<>
							<Menu.Separator />
							<Menu.Item destructive onClick={() => onSelectNewAvatar(null)}>
								<Menu.ItemText>{m['components.editableUserAvatar.remove']()}</Menu.ItemText>
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
				aspectRatio={1}
				circularCrop={circular}
			/>
		</>
	);
}
