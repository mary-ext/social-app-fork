import { EditableUserAvatar } from '#/components/EditableUserAvatar';

import { resolveImageUrl, toImageEdit } from '../lib/image-edit';
import type { ProfileImageEdit } from '../lib/profile-edits';
import { EditableBanner } from './EditableBanner';
import * as styles from './ProfileImagesEditor.css';

/**
 * banner and avatar pickers, laid out like the profile header.
 *
 * @param props current images, pending edits, and change callbacks
 * @returns the image editors
 */
export const ProfileImagesEditor = ({
	currentAvatar,
	currentBanner,
	avatar,
	banner,
	onAvatarChange,
	onBannerChange,
}: {
	currentAvatar: string | undefined;
	currentBanner: string | undefined;
	avatar: ProfileImageEdit | undefined;
	banner: ProfileImageEdit | undefined;
	onAvatarChange: (edit: ProfileImageEdit) => void;
	onBannerChange: (edit: ProfileImageEdit) => void;
}) => {
	return (
		<div className={styles.root}>
			<EditableBanner
				banner={resolveImageUrl(banner, currentBanner)}
				onSelectNewBanner={(img) => onBannerChange(toImageEdit(img))}
			/>
			<div className={styles.avatar}>
				<EditableUserAvatar
					size={80}
					avatar={resolveImageUrl(avatar, currentAvatar)}
					onSelectNewAvatar={(img) => onAvatarChange(toImageEdit(img))}
				/>
			</div>
		</div>
	);
};
