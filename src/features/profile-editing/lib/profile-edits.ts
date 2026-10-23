import type { ImageMeta } from '#/lib/media/edit-image';

import type { ProfileLink, SavedProfileLink } from '#/features/profile-links/types';

export type ProfileImageEdit = { kind: 'remove' } | { kind: 'replace'; image: ImageMeta };

/** profile edits; omitted fields are unchanged, empty strings clear text fields. */
export type ProfileEdits = {
	avatar?: ProfileImageEdit;
	banner?: ProfileImageEdit;
	description?: string;
	displayName?: string;
	/** the links as loaded and as they should be saved. */
	links?: { existing: SavedProfileLink[]; next: ProfileLink[] };
};
