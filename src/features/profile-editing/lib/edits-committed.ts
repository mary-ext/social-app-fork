import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type { AppBskyActorDefs } from '@atcute/bluesky';

import { sameLinkCids } from '#/features/profile-links/record';

import type { ProfileEdits, ProfileImageEdit } from './profile-edits';

const imageEditCommitted = (
	edit: ProfileImageEdit | undefined,
	current: string | undefined,
	fresh: string | undefined,
): boolean => {
	switch (edit?.kind) {
		case undefined: {
			return true;
		}
		case 'remove': {
			return !fresh;
		}
		case 'replace': {
			return fresh !== current;
		}
	}
};

/**
 * checks whether a freshly fetched profile view reflects the saved edits.
 *
 * @param options.edits the edits that were saved
 * @param options.fresh the profile view fetched after saving
 * @param options.linkRefs the link records the profile should now reference, if links were edited
 * @param options.profile the profile view the edits were made against
 * @returns whether every edit is visible in `fresh`
 */
export const editsCommitted = ({
	edits,
	fresh,
	linkRefs,
	profile,
}: {
	edits: ProfileEdits;
	fresh: AppBskyActorDefs.ProfileViewDetailed;
	linkRefs: ComAtprotoRepoStrongRef.Main[] | undefined;
	profile: AppBskyActorDefs.ProfileViewDetailed;
}): boolean => {
	if (!imageEditCommitted(edits.avatar, profile.avatar, fresh.avatar)) {
		return false;
	}
	if (!imageEditCommitted(edits.banner, profile.banner, fresh.banner)) {
		return false;
	}
	if (edits.description !== undefined && (fresh.description ?? '') !== edits.description) {
		return false;
	}
	if (edits.displayName !== undefined && (fresh.displayName ?? '') !== edits.displayName) {
		return false;
	}
	if (linkRefs && !sameLinkCids(fresh.links, linkRefs)) {
		return false;
	}
	if (edits.pinnedPost !== undefined && fresh.pinnedPost?.uri !== edits.pinnedPost?.uri) {
		return false;
	}
	if (edits.selfLabel) {
		const { enabled, value } = edits.selfLabel;
		const labeled = !!fresh.labels?.some((label) => label.val === value && label.src === profile.did);
		if (labeled !== enabled) {
			return false;
		}
	}
	return true;
};
