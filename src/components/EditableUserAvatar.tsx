import { assignInlineVars } from '@vanilla-extract/dynamic';

import { isCancelledError } from '#/lib/errors';
import { compressProfileImage, type ImageMeta } from '#/lib/media/edit-image';
import { getImageDimensions } from '#/lib/media/metadata';
import { openImagePicker } from '#/lib/media/picker';

import { EditImageDialog, type EditImageTarget } from '#/features/image-editing/EditImageDialog';

import * as Dialog from '#/components/Dialog';
import * as styles from '#/components/EditableUserAvatar.css';
import * as Menu from '#/components/Menu';
import { UserAvatar, type UserAvatarType } from '#/components/UserAvatar';

import CameraFilledIcon from '#/icons/central/Camera1_round_filled_radius1_stroke2.svg';
import LibraryIcon from '#/icons/central/Streaming_round_outlined_radius1_stroke2.svg';
import TrashIcon from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
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
	const editImageDialogHandle = Dialog.useDialogHandle<EditImageTarget>();

	const circular = type !== 'algo' && type !== 'list';
	const radius = circular ? '50%' : size > 32 ? '8px' : '3px';

	const onOpenLibrary = async () => {
		const file = await openImagePicker();
		if (!file) {
			return;
		}
		try {
			const dimensions = await getImageDimensions(file);
			editImageDialogHandle.openWithPayload({ source: { blob: file, ...dimensions } });
		} catch (e) {
			// a user-cancelled selection is not a failure worth reporting
			if (!isCancelledError(e)) {
				console.error('Failed to crop avatar', e);
			}
		}
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
						<CameraFilledIcon className={styles.cameraFilledIcon} />
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
				onSave={(edited, { source }) => {
					void compressProfileImage(edited?.transformed ?? source, 1000, 1000).then(onSelectNewAvatar);
				}}
				aspectRatio={1}
				circularCrop={circular}
			/>
		</>
	);
}
