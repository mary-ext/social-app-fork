import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useModerationOpts } from '#/state/moderation/moderation-opts';

import { filterModeratedLinkViews, linksFromProfileView } from './record';
import type { SavedProfileLink } from './types';

/**
 * returns visible profile links, or an empty list while moderation settings load.
 *
 * @param profile the profile view
 * @returns the links to show
 */
export const useProfileViewLinks = (profile: AppBskyActorDefs.ProfileViewDetailed): SavedProfileLink[] => {
	const moderationOpts = useModerationOpts();
	if (!moderationOpts) {
		return [];
	}
	return linksFromProfileView(filterModeratedLinkViews(profile.links, moderationOpts));
};
