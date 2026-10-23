import type { ImageMeta } from '#/lib/media/edit-image';
import { getBlobUrl } from '#/lib/utils/blob-url';

import type { ProfileImageEdit } from './profile-edits';

/**
 * @param edit the pending edit, or `undefined` if unchanged
 * @param current the image URL currently on the profile
 * @returns the image URL to preview
 */
export const resolveImageUrl = (
	edit: ProfileImageEdit | undefined,
	current: string | undefined,
): string | undefined => {
	switch (edit?.kind) {
		case undefined: {
			return current;
		}
		case 'remove': {
			return undefined;
		}
		case 'replace': {
			return getBlobUrl(edit.image.blob);
		}
	}
};

/**
 * @param img the image picked by the user, or `null` if they removed it
 * @returns the corresponding profile image edit
 */
export const toImageEdit = (img: ImageMeta | null): ProfileImageEdit => {
	if (img === null) {
		return { kind: 'remove' };
	}

	return { kind: 'replace', image: img };
};
